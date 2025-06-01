import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import {
  DocumentTextIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  FlagIcon,
  SparklesIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { Specification, SpecificationContent, RequirementItem, NonFunctionalRequirement, Milestone, Risk, Constraint } from '@/api/specification';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/date';

// --- Types ---
interface EditableSectionProps {
  title: string;
  content: ReactNode;
  isEditing: boolean;
  onContentChange?: (newContent: string) => void; // For simple text content
  onFlag?: () => void;
  confidence?: number; // Optional section-specific confidence
  clarificationNeeded?: boolean;
  className?: string;
  children?: ReactNode; // For complex content structures
  initialContentForEdit?: string; // For textarea
}

interface EnhancedSpecificationViewProps {
  specification: Specification | null;
  isLoading?: boolean;
  error?: string | null;
  onSaveChanges?: (updatedContent: SpecificationContent) => Promise<void>;
  onFlagItem?: (section: string, itemId: string, reason: string) => void;
  className?: string;
}

// --- Helper Components ---

const ConfidenceIndicator: React.FC<{ score: number }> = ({ score }) => {
  const scorePercentage = Math.round(score * 100);
  let colorClass = 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400';
  if (score < 0.8 && score >= 0.6) {
    colorClass = 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400';
  } else if (score < 0.6) {
    colorClass = 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400';
  }

  return (
    <Badge variant="default" className={cn('font-semibold', colorClass)}>
      Confidence: {scorePercentage}%
    </Badge>
  );
};

const EditableField: React.FC<{
  value: string;
  isEditing: boolean;
  onChange: (newValue: string) => void;
  textarea?: boolean;
  placeholder?: string;
  className?: string;
}> = ({ value, isEditing, onChange, textarea = false, placeholder, className }) => {
  if (isEditing) {
    return textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 min-h-[100px]",
          className
        )}
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500",
          className
        )}
      />
    );
  }
  return <span className={cn("whitespace-pre-line", className)}>{value || <span className="italic text-neutral-500 dark:text-neutral-400">{placeholder || 'Not set'}</span>}</span>;
};

const SectionWrapper: React.FC<EditableSectionProps> = ({
  title,
  content,
  isEditing,
  onContentChange,
  onFlag,
  confidence,
  clarificationNeeded,
  className,
  children,
  initialContentForEdit
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className={cn(className, clarificationNeeded && 'border-warning-500 dark:border-warning-400 ring-1 ring-warning-500 dark:ring-warning-400')}>
      <Card.Header className="flex justify-between items-center">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
          {clarificationNeeded && (
            <ExclamationTriangleIcon className="w-5 h-5 ml-2 text-warning-500" titleAccess="Clarification needed for this section" />
          )}
          {confidence !== undefined && (
            <div className="ml-3">
              <ConfidenceIndicator score={confidence} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onFlag && (
            <Button variant="outline" size="sm" onClick={onFlag} icon={<FlagIcon className="w-4 h-4" />}>
              Flag
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} icon={isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </Button>
        </div>
      </Card.Header>
      {isExpanded && (
        <Card.Body>
          {onContentChange && typeof content === 'string' ? ( // Simple text content editing
            <EditableField
              value={initialContentForEdit ?? content}
              isEditing={isEditing}
              onChange={onContentChange}
              textarea
              placeholder={`Enter ${title.toLowerCase()} here...`}
            />
          ) : (
            children || content // Complex children rendering or static content
          )}
        </Card.Body>
      )}
    </Card>
  );
};

// --- Main Component ---
const EnhancedSpecificationView: React.FC<EnhancedSpecificationViewProps> = ({
  specification,
  isLoading = false,
  error = null,
  onSaveChanges,
  onFlagItem,
  className = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState<SpecificationContent | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (specification) {
      setEditedContent(JSON.parse(JSON.stringify(specification.content))); // Deep copy
    } else {
      setEditedContent(null);
    }
  }, [specification]);

  const handleContentChange = useCallback((section: keyof SpecificationContent, value: any, index?: number, field?: string) => {
    setEditedContent(prev => {
      if (!prev) return null;
      const newContent = { ...prev };
      if (index !== undefined && Array.isArray(newContent[section])) {
        const sectionArray = [...(newContent[section] as any[])];
        if (field) {
          sectionArray[index] = { ...sectionArray[index], [field]: value };
        } else {
          sectionArray[index] = value; // Assuming value is the whole item
        }
        (newContent[section] as any) = sectionArray;
      } else if (typeof newContent[section] === 'object' && newContent[section] !== null && field) {
        (newContent[section] as any)[field] = value;
      }
      else {
        (newContent[section] as any) = value;
      }
      return newContent;
    });
  }, []);

  const handleSaveChanges = async () => {
    if (!editedContent || !onSaveChanges) return;
    setIsSaving(true);
    try {
      await onSaveChanges(editedContent);
      toast.success('Specification saved successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to save specification.');
      console.error("Save error:", err);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleFlagItem = (section: string, itemId: string) => {
    if (!onFlagItem) return;
    const reason = prompt(`Please provide a reason for flagging this item in ${section}:`);
    if (reason) {
      onFlagItem(section, itemId, reason);
      toast.info(`Item ${itemId} in ${section} flagged for review.`);
    }
  };

  const getClarificationNeeded = (sectionKey: string): boolean => {
    return !!editedContent?.pending_clarifications_for_development?.some(
      clarification => clarification.area_affected?.toLowerCase().includes(sectionKey.toLowerCase())
    );
  };

  // --- Loading and Error States ---
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <Spinner size="lg" label="Loading specification..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" className={cn("max-w-md mx-auto text-center", className)}>
        <XCircleIcon className="h-12 w-12 text-error-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          Failed to load specification
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>Try Again</Button>
      </Card>
    );
  }

  if (!specification || !editedContent) {
    return (
      <Card variant="outlined" className={cn("max-w-md mx-auto text-center", className)}>
        <DocumentTextIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
          No Specification Loaded
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          Please select a specification to view its details.
        </p>
      </Card>
    );
  }

  // --- Main Render ---
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {editedContent.project_name || specification.project_name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>Created: {formatDate(specification.created_at)}</span>
            <span>Version: {specification.version}</span>
            {editedContent.overall_specification_confidence_score !== undefined && (
              <ConfidenceIndicator score={editedContent.overall_specification_confidence_score} />
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={isEditing ? "success" : "outline"}
            icon={isEditing ? <CheckCircleIcon className="w-5 h-5" /> : <PencilSquareIcon className="w-5 h-5" />}
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            isLoading={isSaving}
            loadingText="Saving..."
            disabled={isSaving}
          >
            {isEditing ? 'Save Changes' : 'Edit Specification'}
          </Button>
          {isEditing && (
             <Button variant="ghost" onClick={() => { setIsEditing(false); setEditedContent(JSON.parse(JSON.stringify(specification.content))); }} disabled={isSaving}>
               Cancel
             </Button>
          )}
        </div>
      </div>

      {/* Overall Generation Notes */}
      {editedContent.specification_generation_notes && (
        <Card variant="ghost">
          <Card.Header>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white flex items-center">
              <InformationCircleIcon className="w-5 h-5 mr-2 text-primary-500" />
              AI Generation Notes
            </h3>
          </Card.Header>
          <Card.Body>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
              {editedContent.specification_generation_notes}
            </p>
          </Card.Body>
        </Card>
      )}
      
      {/* Pending Clarifications */}
      {editedContent.pending_clarifications_for_development && editedContent.pending_clarifications_for_development.length > 0 && (
        <Card variant="outlined" border="warning">
          <Card.Header>
            <h2 className="text-xl font-semibold text-warning-700 dark:text-warning-400 flex items-center">
              <ExclamationTriangleIcon className="w-6 h-6 mr-2" />
              Pending Clarifications
            </h2>
          </Card.Header>
          <Card.Body>
            <ul className="space-y-3">
              {editedContent.pending_clarifications_for_development.map((clarification, index) => (
                <li key={clarification.item_id || index} className="p-3 bg-warning-50 dark:bg-warning-900/20 rounded-md">
                  <p className="text-sm font-medium text-warning-800 dark:text-warning-300">
                    Area: {clarification.area_affected || 'General'}
                  </p>
                  <p className="text-sm text-warning-700 dark:text-warning-400 mt-1">
                    {clarification.question_or_gap}
                  </p>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      )}

      {/* Executive Summary */}
      <SectionWrapper
        title="Executive Summary"
        content={editedContent.executive_summary}
        isEditing={isEditing}
        onContentChange={(value) => handleContentChange('executive_summary', value)}
        initialContentForEdit={editedContent.executive_summary}
        clarificationNeeded={getClarificationNeeded('executive summary')}
        onFlag={() => handleFlagItem('Executive Summary', 'summary', prompt('Reason for flagging Executive Summary:') || 'Needs review')}
      />

      {/* Functional Requirements */}
      <SectionWrapper
        title="Functional Requirements"
        isEditing={isEditing}
        clarificationNeeded={getClarificationNeeded('functional requirement')}
        onFlag={() => handleFlagItem('Functional Requirements', 'all_frs', prompt('Reason for flagging Functional Requirements section:') || 'Needs review')}
      >
        {editedContent.functional_requirements.length === 0 ? (
          <p className="italic text-neutral-500 dark:text-neutral-400">No functional requirements defined.</p>
        ) : (
          <div className="space-y-4">
            {editedContent.functional_requirements.map((req, index) => (
              <Card key={req.id || index} variant="outlined" className={cn(getClarificationNeeded(req.id || `FR-${index}`) && 'border-warning-500 dark:border-warning-400 ring-1 ring-warning-500 dark:ring-warning-400')}>
                <Card.Header className="flex justify-between items-center">
                  <EditableField value={req.title} isEditing={isEditing} onChange={(val) => handleContentChange('functional_requirements', val, index, 'title')} placeholder="Requirement Title" className="font-medium text-lg"/>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                       <select
                         value={req.priority}
                         onChange={(e) => handleContentChange('functional_requirements', e.target.value, index, 'priority')}
                         className="rounded-md border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-xs px-2 py-1 focus:ring-primary-500 focus:border-primary-500"
                       >
                         <option value="High">High</option>
                         <option value="Medium">Medium</option>
                         <option value="Low">Low</option>
                       </select>
                    ) : (
                      <Badge variant={req.priority === 'High' ? 'error' : req.priority === 'Medium' ? 'warning' : 'success'}>
                        {req.priority}
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" icon={<FlagIcon className="w-4 h-4" />} onClick={() => handleFlagItem('Functional Requirement', req.id || `FR-${index}`, prompt(`Reason for flagging "${req.title}":`) || 'Needs review')} />
                  </div>
                </Card.Header>
                <Card.Body className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Description</label>
                    <EditableField value={req.description} isEditing={isEditing} onChange={(val) => handleContentChange('functional_requirements', val, index, 'description')} textarea placeholder="Detailed description..." />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Acceptance Criteria</label>
                    {isEditing ? (
                      <textarea
                        value={Array.isArray(req.acceptance_criteria) ? req.acceptance_criteria.join('\n') : ''}
                        onChange={(e) => handleContentChange('functional_requirements', e.target.value.split('\n'), index, 'acceptance_criteria')}
                        rows={3}
                        placeholder="Enter criteria, one per line"
                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    ) : (
                      <ul className="list-disc list-inside pl-1 text-sm">
                        {Array.isArray(req.acceptance_criteria) && req.acceptance_criteria.map((ac, acIndex) => <li key={acIndex}>{ac}</li>)}
                      </ul>
                    )}
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        )}
      </SectionWrapper>
      
      {/* Non-Functional Requirements, Constraints, Tech Stack, Milestones, Assumptions, Risks - similar structure to Functional Requirements */}
      {/* For brevity, I'll skip detailed editable implementation for these, but the pattern would be similar */}

      <SectionWrapper title="Non-Functional Requirements" isEditing={isEditing} clarificationNeeded={getClarificationNeeded('non-functional requirement')}>
        {/* Content for NFRs */}
        <ul className="space-y-2">
          {editedContent.non_functional_requirements.map((nfr, i) => <li key={nfr.id || i}>{nfr.category}: {nfr.description} (Target: {nfr.metric_target})</li>)}
        </ul>
      </SectionWrapper>

      <SectionWrapper title="Constraints" isEditing={isEditing} clarificationNeeded={getClarificationNeeded('constraint')}>
        {/* Content for Constraints */}
        <ul className="space-y-2">
          {editedContent.constraints.map((constraint, i) => <li key={constraint.id || i}>{constraint.description}</li>)}
        </ul>
      </SectionWrapper>
      
      <SectionWrapper title="Technology Stack" isEditing={isEditing} clarificationNeeded={getClarificationNeeded('technology stack')}>
        {/* Content for Tech Stack */}
        <pre className="text-sm bg-neutral-100 dark:bg-neutral-900 p-3 rounded-md overflow-x-auto">
          {JSON.stringify(editedContent.tech_stack, null, 2)}
        </pre>
      </SectionWrapper>

      <SectionWrapper title="Project Milestones" isEditing={isEditing} clarificationNeeded={getClarificationNeeded('milestone')}>
        {/* Content for Milestones */}
        <ul className="space-y-2">
          {editedContent.milestones.map((milestone, i) => <li key={milestone.milestone_id || i}>{milestone.name} ({milestone.estimated_duration})</li>)}
        </ul>
      </SectionWrapper>

      <SectionWrapper title="Assumptions" isEditing={isEditing} clarificationNeeded={getClarificationNeeded('assumption')}>
        {/* Content for Assumptions */}
        <ul className="space-y-2">
          {editedContent.assumptions.map((assumption, i) => <li key={i}>{assumption}</li>)}
        </ul>
      </SectionWrapper>

      <SectionWrapper title="Risks" isEditing={isEditing} clarificationNeeded={getClarificationNeeded('risk')}>
        {/* Content for Risks */}
        <ul className="space-y-2">
          {editedContent.risks.map((risk, i) => <li key={risk.risk_id || i}>{risk.description} (Impact: {risk.impact}, Likelihood: {risk.likelihood})</li>)}
        </ul>
      </SectionWrapper>

      {/* Save Changes Footer (sticky) */}
      {isEditing && (
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 p-4 border-t border-neutral-200 dark:border-neutral-700 shadow-top z-10">
          <div className="max-w-7xl mx-auto flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setIsEditing(false); setEditedContent(JSON.parse(JSON.stringify(specification.content))); }} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveChanges} isLoading={isSaving} loadingText="Saving..." disabled={isSaving}>
              Save All Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSpecificationView;
