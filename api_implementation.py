"""
API Implementation for Layer 1 of the AI Assistant Platform.

This module provides the FastAPI routes and application setup for the
Intelligent Prompt Expansion & Specification service.
"""

import uuid
import logging
import time
from typing import Dict, List, Optional, Any, Union, Literal
from datetime import datetime

import redis.asyncio as redis
from fastapi import FastAPI, HTTPException, Depends, Header, Request, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, Field, validator

from core.prompt_analysis_engine import PromptAnalysisEngine, AnalysisResult
from core.conversation_manager import ConversationManager
from core.domain_integrator import DomainKnowledgeIntegrator
from core.spec_generator import SpecificationGenerator
from core.models.conversation import ConversationState, ConversationStage
from core.models.specification import ProjectSpecification
from core.db.repository import SpecificationRepository
from core.llm.provider import get_llm_provider

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Assistant Platform - Layer 1",
    description="Intelligent Prompt Expansion & Specification Service",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OAuth2 for authentication (placeholder)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Redis connection for conversation state
redis_pool = None

# Request/Response Models
class StartConversationRequest(BaseModel):
    """Request model for starting a new specification conversation."""
    initial_prompt: str = Field(..., min_length=5, description="Initial project description")
    project_name: Optional[str] = Field(None, description="Optional project name")
    user_skill_level: Optional[Literal["beginner", "intermediate", "expert"]] = Field(
        None, description="User's skill level"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "initial_prompt": "I want to build a website where users can upload photos and share them with friends.",
                "project_name": "PhotoShare",
                "user_skill_level": "intermediate"
            }
        }


class MessageRequest(BaseModel):
    """Request model for sending a message in an existing conversation."""
    message: str = Field(..., min_length=1, description="User message")
    
    class Config:
        schema_extra = {
            "example": {
                "message": "The website should also allow users to create albums and add tags to photos."
            }
        }


class ConversationResponse(BaseModel):
    """Response model for conversation interactions."""
    conversation_id: str = Field(..., description="Unique conversation identifier")
    message: str = Field(..., description="Assistant response message")
    stage: ConversationStage = Field(..., description="Current conversation stage")
    awaiting_user: bool = Field(..., description="Whether the assistant is waiting for user input")
    spec_ready: bool = Field(..., description="Whether the specification is ready")
    spec_id: Optional[str] = Field(None, description="Specification ID if ready")
    
    class Config:
        schema_extra = {
            "example": {
                "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
                "message": "Thanks for the information! What kind of sharing permissions do you want users to have?",
                "stage": "clarifying",
                "awaiting_user": True,
                "spec_ready": False,
                "spec_id": None
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response model."""
    status: str = "error"
    message: str
    code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class SpecificationResponse(BaseModel):
    """Response model for specification retrieval."""
    spec_id: str = Field(..., description="Specification identifier")
    project_name: str = Field(..., description="Project name")
    content: Dict[str, Any] = Field(..., description="Full specification content")
    created_at: datetime = Field(..., description="Creation timestamp")
    version: int = Field(..., description="Specification version")
    
    class Config:
        schema_extra = {
            "example": {
                "spec_id": "550e8400-e29b-41d4-a716-446655440000",
                "project_name": "PhotoShare",
                "content": {
                    "executive_summary": "A photo sharing website with social features",
                    "functional_requirements": ["User authentication", "Photo upload"],
                    "non_functional_requirements": ["Response time < 2s", "99.9% uptime"],
                    "tech_stack": {
                        "frontend": "React + TypeScript",
                        "backend": "FastAPI + PostgreSQL"
                    },
                    "milestones": [
                        {"name": "User Authentication", "duration": "1 week"},
                        {"name": "Photo Upload", "duration": "2 weeks"}
                    ]
                },
                "created_at": "2023-06-01T12:00:00Z",
                "version": 1
            }
        }


# Dependency functions
async def get_redis():
    """Get Redis connection from pool."""
    global redis_pool
    if redis_pool is None:
        # Initialize pool on first use
        redis_pool = redis.ConnectionPool.from_url("redis://redis:6379/0")
    
    conn = redis.Redis(connection_pool=redis_pool)
    try:
        yield conn
    finally:
        await conn.close()


async def get_conversation_manager(
    redis_conn: redis.Redis = Depends(get_redis)
) -> ConversationManager:
    """Get conversation manager instance."""
    return ConversationManager(redis_conn)


async def get_prompt_analysis_engine() -> PromptAnalysisEngine:
    """Get prompt analysis engine instance."""
    llm = await get_llm_provider()
    return PromptAnalysisEngine(llm=llm)


async def get_domain_integrator() -> DomainKnowledgeIntegrator:
    """Get domain knowledge integrator instance."""
    llm = await get_llm_provider()
    return DomainKnowledgeIntegrator(llm=llm)


async def get_spec_generator() -> SpecificationGenerator:
    """Get specification generator instance."""
    llm = await get_llm_provider()
    return SpecificationGenerator(llm=llm)


async def get_spec_repository() -> SpecificationRepository:
    """Get specification repository instance."""
    return SpecificationRepository()


async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Placeholder for user authentication.
    
    In a production environment, this would validate the token and return the user.
    """
    # For now, just return a dummy user ID
    return {"user_id": "test_user"}


# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with standard format."""
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            message=exc.detail,
            code=f"HTTP_{exc.status_code}"
        ).dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions with standard format."""
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            message="An unexpected error occurred",
            code="INTERNAL_SERVER_ERROR",
            details={"error_type": str(type(exc).__name__)}
        ).dict()
    )


# API Routes
@app.post(
    "/v1/specify/start",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new specification conversation",
    response_description="New conversation details with initial assistant response"
)
async def start_conversation(
    request: StartConversationRequest,
    background_tasks: BackgroundTasks,
    conversation_manager: ConversationManager = Depends(get_conversation_manager),
    analysis_engine: PromptAnalysisEngine = Depends(get_prompt_analysis_engine),
    current_user: Dict = Depends(get_current_user)
):
    """
    Start a new specification conversation with an initial project description.
    
    This endpoint initializes a new conversation, analyzes the initial prompt,
    and returns the first assistant response with clarifying questions.
    """
    # Generate a new conversation ID
    conversation_id = str(uuid.uuid4())
    
    # Log the conversation start
    logger.info(f"Starting new conversation {conversation_id} for user {current_user['user_id']}")
    
    try:
        # Initialize conversation state
        await conversation_manager.initialize_conversation(
            conversation_id=conversation_id,
            user_id=current_user["user_id"],
            initial_prompt=request.initial_prompt,
            project_name=request.project_name,
            user_skill_level=request.user_skill_level
        )
        
        # Analyze the initial prompt in the background
        background_tasks.add_task(
            analyze_initial_prompt,
            conversation_id=conversation_id,
            initial_prompt=request.initial_prompt,
            conversation_manager=conversation_manager,
            analysis_engine=analysis_engine
        )
        
        # Return initial response while analysis happens in background
        return ConversationResponse(
            conversation_id=conversation_id,
            message="Thanks for your project description! I'm analyzing it now and will follow up with some clarifying questions momentarily.",
            stage=ConversationStage.COLLECTING,
            awaiting_user=False,
            spec_ready=False
        )
        
    except Exception as e:
        logger.exception(f"Error starting conversation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start conversation: {str(e)}"
        )


@app.post(
    "/v1/specify/{conversation_id}",
    response_model=ConversationResponse,
    summary="Send a message in an existing conversation",
    response_description="Assistant response with updated conversation state"
)
async def send_message(
    conversation_id: str,
    request: MessageRequest,
    conversation_manager: ConversationManager = Depends(get_conversation_manager),
    domain_integrator: DomainKnowledgeIntegrator = Depends(get_domain_integrator),
    spec_generator: SpecificationGenerator = Depends(get_spec_generator),
    spec_repository: SpecificationRepository = Depends(get_spec_repository),
    current_user: Dict = Depends(get_current_user)
):
    """
    Send a user message in an existing specification conversation.
    
    This endpoint processes the user's message, updates the conversation state,
    and returns the next assistant response based on the current stage.
    """
    # Check if conversation exists
    conversation = await conversation_manager.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found"
        )
    
    # Check if user owns this conversation
    if conversation.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this conversation"
        )
    
    # Log the message
    logger.info(f"Processing message in conversation {conversation_id}")
    
    try:
        # Process the message based on current stage
        if conversation.stage == ConversationStage.COLLECTING:
            # Add to collected information
            await conversation_manager.add_user_message(
                conversation_id=conversation_id,
                message=request.message
            )
            
            # Move to clarifying if we have open questions
            if conversation.open_questions:
                conversation.stage = ConversationStage.CLARIFYING
                next_question = conversation.open_questions[0]
                await conversation_manager.update_conversation(conversation)
                
                return ConversationResponse(
                    conversation_id=conversation_id,
                    message=next_question,
                    stage=conversation.stage,
                    awaiting_user=True,
                    spec_ready=False
                )
            else:
                # No open questions, move to generating
                conversation.stage = ConversationStage.GENERATING
                await conversation_manager.update_conversation(conversation)
                
                # Generate specification asynchronously
                spec = await generate_specification(
                    conversation=conversation,
                    domain_integrator=domain_integrator,
                    spec_generator=spec_generator,
                    spec_repository=spec_repository
                )
                
                # Update conversation with spec ID
                conversation.spec_id = spec.id
                conversation.stage = ConversationStage.COMPLETED
                await conversation_manager.update_conversation(conversation)
                
                return ConversationResponse(
                    conversation_id=conversation_id,
                    message=f"I've completed your project specification! You can view the full details or ask me questions about it.",
                    stage=ConversationStage.COMPLETED,
                    awaiting_user=False,
                    spec_ready=True,
                    spec_id=spec.id
                )
                
        elif conversation.stage == ConversationStage.CLARIFYING:
            # Process answer to current question
            current_question = conversation.open_questions[0]
            await conversation_manager.answer_question(
                conversation_id=conversation_id,
                question=current_question,
                answer=request.message
            )
            
            # Update conversation
            conversation = await conversation_manager.get_conversation(conversation_id)
            
            # Check if we have more questions
            if conversation.open_questions:
                next_question = conversation.open_questions[0]
                return ConversationResponse(
                    conversation_id=conversation_id,
                    message=next_question,
                    stage=conversation.stage,
                    awaiting_user=True,
                    spec_ready=False
                )
            else:
                # No more questions, move to generating
                conversation.stage = ConversationStage.GENERATING
                await conversation_manager.update_conversation(conversation)
                
                # Generate specification asynchronously
                spec = await generate_specification(
                    conversation=conversation,
                    domain_integrator=domain_integrator,
                    spec_generator=spec_generator,
                    spec_repository=spec_repository
                )
                
                # Update conversation with spec ID
                conversation.spec_id = spec.id
                conversation.stage = ConversationStage.COMPLETED
                await conversation_manager.update_conversation(conversation)
                
                return ConversationResponse(
                    conversation_id=conversation_id,
                    message=f"Great! I've completed your project specification based on our conversation. You can now view the full specification document.",
                    stage=ConversationStage.COMPLETED,
                    awaiting_user=False,
                    spec_ready=True,
                    spec_id=spec.id
                )
                
        elif conversation.stage == ConversationStage.COMPLETED:
            # Handle questions about the completed spec
            spec = await spec_repository.get_specification(conversation.spec_id)
            if not spec:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Specification not found"
                )
            
            # TODO: Implement Q&A about the specification
            # For now, just return a simple response
            return ConversationResponse(
                conversation_id=conversation_id,
                message=f"Your project '{spec.project_name}' specification is complete. You can view the full details using the spec_id.",
                stage=conversation.stage,
                awaiting_user=False,
                spec_ready=True,
                spec_id=spec.id
            )
            
        else:
            # Invalid stage
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid conversation stage: {conversation.stage}"
            )
            
    except Exception as e:
        logger.exception(f"Error processing message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process message: {str(e)}"
        )


@app.get(
    "/v1/spec/{spec_id}",
    response_model=SpecificationResponse,
    summary="Get a completed project specification",
    response_description="Full project specification document"
)
async def get_specification(
    spec_id: str,
    spec_repository: SpecificationRepository = Depends(get_spec_repository),
    current_user: Dict = Depends(get_current_user)
):
    """
    Retrieve a completed project specification by ID.
    
    This endpoint returns the full specification document for a given spec_id,
    including requirements, tech stack, and milestones.
    """
    # Get the specification
    spec = await spec_repository.get_specification(spec_id)
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Specification {spec_id} not found"
        )
    
    # Check if user has access
    if spec.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this specification"
        )
    
    # Return the specification
    return SpecificationResponse(
        spec_id=spec.id,
        project_name=spec.project_name,
        content=spec.content,
        created_at=spec.created_at,
        version=spec.version
    )


# Background tasks
async def analyze_initial_prompt(
    conversation_id: str,
    initial_prompt: str,
    conversation_manager: ConversationManager,
    analysis_engine: PromptAnalysisEngine
):
    """
    Analyze the initial prompt in the background and update the conversation.
    
    This function runs as a background task to avoid blocking the API response.
    """
    try:
        # Get the conversation
        conversation = await conversation_manager.get_conversation(conversation_id)
        if not conversation:
            logger.error(f"Conversation {conversation_id} not found for analysis")
            return
        
        # Analyze the prompt
        analysis_result = await analysis_engine.analyze_prompt(initial_prompt)
        
        # Extract missing information questions
        missing_info = analysis_engine.prioritize_missing_info(analysis_result)
        open_questions = [info.question for info in missing_info]
        
        # Update conversation with analysis results and questions
        conversation.analyzed = True
        conversation.analysis_result = analysis_result.dict()
        conversation.open_questions = open_questions
        conversation.stage = ConversationStage.CLARIFYING
        
        # Save updated conversation
        await conversation_manager.update_conversation(conversation)
        
        logger.info(f"Completed initial prompt analysis for conversation {conversation_id}")
        
    except Exception as e:
        logger.exception(f"Error analyzing initial prompt: {str(e)}")


async def generate_specification(
    conversation: ConversationState,
    domain_integrator: DomainKnowledgeIntegrator,
    spec_generator: SpecificationGenerator,
    spec_repository: SpecificationRepository
) -> ProjectSpecification:
    """
    Generate a project specification from the conversation data.
    
    This function integrates domain knowledge, generates the specification,
    and stores it in the repository.
    """
    try:
        # Integrate domain knowledge
        enriched_data = await domain_integrator.enrich_conversation_data(conversation)
        
        # Generate specification
        spec_content = await spec_generator.generate_specification(
            conversation=conversation,
            enriched_data=enriched_data
        )
        
        # Create specification object
        project_name = conversation.project_name or "Untitled Project"
        spec = ProjectSpecification(
            id=str(uuid.uuid4()),
            user_id=conversation.user_id,
            project_name=project_name,
            content=spec_content,
            created_at=datetime.now(),
            version=1
        )
        
        # Store in repository
        await spec_repository.save_specification(spec)
        
        logger.info(f"Generated specification {spec.id} for conversation {conversation.id}")
        
        return spec
        
    except Exception as e:
        logger.exception(f"Error generating specification: {str(e)}")
        raise


# Health check endpoint
@app.get(
    "/health",
    summary="Health check endpoint",
    response_description="Service health status"
)
async def health_check():
    """Check the health of the service."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": app.version
    }


# Main entry point
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
