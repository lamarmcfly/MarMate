"""
Prompt Analysis Engine for Layer 1 of the AI Assistant Platform.

This module analyzes user prompts to extract key entities, identify missing information,
and detect technical terminology to drive the multi-turn conversation flow.
"""

import json
import logging
from typing import Dict, List, Optional, Any, Union, TypedDict, cast
from enum import Enum

from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain.schema import BaseLanguageModel
from langchain.output_parsers import PydanticOutputParser, OutputFixingParser
from pydantic import BaseModel, Field, ValidationError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RequirementType(str, Enum):
    """Enumeration of possible requirement types."""
    FUNCTIONAL = "functional"
    NON_FUNCTIONAL = "non-functional"
    CONSTRAINT = "constraint"
    UNKNOWN = "unknown"


class Entity(BaseModel):
    """Represents an extracted entity from the user prompt."""
    name: str = Field(..., description="Name of the entity")
    type: str = Field(..., description="Type of entity (e.g., 'feature', 'user', 'system')")
    description: str = Field(..., description="Brief description of the entity")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0.0-1.0)")


class MissingInfo(BaseModel):
    """Represents missing information that needs clarification."""
    question: str = Field(..., description="Question to ask the user")
    context: str = Field(..., description="Why this information is needed")
    priority: int = Field(..., ge=1, le=5, description="Priority (1-5, 5 being highest)")
    related_entities: List[str] = Field(default_factory=list, description="Related entity names")


class TechnicalTerm(BaseModel):
    """Represents a technical term identified in the prompt."""
    layman_term: str = Field(..., description="Original non-technical term used")
    technical_equivalent: str = Field(..., description="Technical/industry-standard term")
    explanation: str = Field(..., description="Brief explanation of the term")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0.0-1.0)")


class AnalysisResult(BaseModel):
    """Complete analysis result from the prompt analysis engine."""
    entities: List[Entity] = Field(default_factory=list, description="Extracted entities")
    missing_info: List[MissingInfo] = Field(default_factory=list, description="Missing information")
    technical_terms: List[TechnicalTerm] = Field(default_factory=list, description="Technical terminology mapping")
    requirements: Dict[str, List[str]] = Field(
        default_factory=dict, 
        description="Categorized requirements (functional, non-functional, constraints)"
    )
    intent: str = Field("", description="Overall user intent")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence in analysis")


class PromptAnalysisEngine:
    """
    Engine for analyzing user prompts to extract structured information.
    
    This class uses LLM chains to process natural language project descriptions
    and extract entities, identify missing information, and translate terminology.
    """

    def __init__(
        self, 
        llm: BaseLanguageModel,
        max_retries: int = 2,
        verbose: bool = False
    ):
        """
        Initialize the Prompt Analysis Engine.
        
        Args:
            llm: Language model to use for analysis
            max_retries: Maximum number of retries for parsing failures
            verbose: Whether to log verbose information
        """
        self.llm = llm
        self.max_retries = max_retries
        self.verbose = verbose
        self._initialize_chains()
        logger.info("Prompt Analysis Engine initialized")
    
    def _initialize_chains(self) -> None:
        """Initialize the LangChain chains used for analysis."""
        # Create output parser with fixing capability
        self.output_parser = PydanticOutputParser(pydantic_object=AnalysisResult)
        self.fixing_parser = OutputFixingParser.from_llm(parser=self.output_parser, llm=self.llm)
        
        # Create the main analysis prompt template
        self.analysis_prompt = PromptTemplate(
            template="""
            You are an expert software requirements analyst with deep knowledge of software engineering, 
            project management, and technical architecture.
            
            Analyze the following project description and extract key information:
            
            USER PROJECT DESCRIPTION:
            {user_prompt}
            
            INSTRUCTIONS:
            1. Identify all entities (features, users, systems, data types)
            2. List any missing information that would be critical for implementation
            3. Translate any non-technical terms into proper technical equivalents
            4. Categorize requirements as functional, non-functional, or constraints
            5. Determine the overall user intent
            
            {format_instructions}
            """,
            input_variables=["user_prompt"],
            partial_variables={"format_instructions": self.output_parser.get_format_instructions()}
        )
        
        # Create the LLM chain
        self.analysis_chain = LLMChain(
            llm=self.llm,
            prompt=self.analysis_prompt,
            verbose=self.verbose
        )
    
    async def analyze_prompt(self, user_prompt: str) -> AnalysisResult:
        """
        Analyze a user prompt and extract structured information.
        
        Args:
            user_prompt: The raw user input describing their project
            
        Returns:
            AnalysisResult object containing entities, missing info, and technical terms
            
        Raises:
            ValueError: If analysis fails after maximum retries
        """
        if not user_prompt.strip():
            raise ValueError("Empty prompt provided")
        
        logger.info(f"Analyzing prompt: {user_prompt[:50]}...")
        
        # Try to get a valid result with retries
        result = None
        errors = []
        
        for attempt in range(self.max_retries + 1):
            try:
                # Run the analysis chain
                raw_result = await self.analysis_chain.arun(user_prompt=user_prompt)
                
                # Parse the result
                try:
                    # First try direct parsing
                    result = self.output_parser.parse(raw_result)
                    break
                except ValidationError as e:
                    logger.warning(f"Validation error on attempt {attempt+1}, trying fixing parser: {str(e)}")
                    # If direct parsing fails, try the fixing parser
                    result = self.fixing_parser.parse(raw_result)
                    break
                    
            except Exception as e:
                error_msg = f"Analysis attempt {attempt+1} failed: {str(e)}"
                logger.error(error_msg)
                errors.append(error_msg)
                
                # On the last attempt, raise the error
                if attempt == self.max_retries:
                    raise ValueError(f"Failed to analyze prompt after {self.max_retries + 1} attempts: {errors}")
        
        # Log the result summary
        if result:
            logger.info(
                f"Analysis complete: {len(result.entities)} entities, "
                f"{len(result.missing_info)} missing info items, "
                f"{len(result.technical_terms)} technical terms"
            )
        
        return cast(AnalysisResult, result)
    
    def prioritize_missing_info(self, result: AnalysisResult) -> List[MissingInfo]:
        """
        Prioritize the missing information questions to ask the user.
        
        Args:
            result: The analysis result containing missing information
            
        Returns:
            Sorted list of MissingInfo objects by priority
        """
        # Sort by priority (highest first)
        return sorted(result.missing_info, key=lambda x: x.priority, reverse=True)
    
    def get_technical_translations(self, result: AnalysisResult, min_confidence: float = 0.7) -> Dict[str, str]:
        """
        Get a dictionary of layman terms to technical equivalents.
        
        Args:
            result: The analysis result containing technical terms
            min_confidence: Minimum confidence threshold for inclusion
            
        Returns:
            Dictionary mapping original terms to technical equivalents
        """
        return {
            term.layman_term: term.technical_equivalent 
            for term in result.technical_terms 
            if term.confidence >= min_confidence
        }
    
    def extract_requirements_by_type(self, result: AnalysisResult) -> Dict[RequirementType, List[str]]:
        """
        Extract requirements organized by type.
        
        Args:
            result: The analysis result containing requirements
            
        Returns:
            Dictionary mapping requirement types to lists of requirement strings
        """
        typed_requirements: Dict[RequirementType, List[str]] = {
            RequirementType.FUNCTIONAL: [],
            RequirementType.NON_FUNCTIONAL: [],
            RequirementType.CONSTRAINT: [],
            RequirementType.UNKNOWN: []
        }
        
        # Map the requirements from the result to the typed dictionary
        for req_type, reqs in result.requirements.items():
            try:
                typed_key = RequirementType(req_type)
                typed_requirements[typed_key] = reqs
            except ValueError:
                # If the type doesn't match our enum, put it in UNKNOWN
                typed_requirements[RequirementType.UNKNOWN].extend(reqs)
                
        return typed_requirements


# Example usage (not executed in the module)
"""
async def example_usage():
    from langchain.llms import OpenAI
    
    # Initialize the engine
    llm = OpenAI(temperature=0.1)
    engine = PromptAnalysisEngine(llm=llm, verbose=True)
    
    # Analyze a sample prompt
    result = await engine.analyze_prompt(
        "I want to build a website where users can upload photos and share them with friends."
    )
    
    # Get prioritized questions
    questions = engine.prioritize_missing_info(result)
    
    # Get technical translations
    translations = engine.get_technical_translations(result)
    
    # Get requirements by type
    requirements = engine.extract_requirements_by_type(result)
    
    return result, questions, translations, requirements
"""
