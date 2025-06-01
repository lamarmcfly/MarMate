import React, { useState } from 'react';
import { 
  DocumentTextIcon, 
  CodeBracketIcon, 
  ShareIcon, 
  ArrowDownTrayIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Specification, RequirementItem, NonFunctionalRequirement, Milestone, Risk } from '@/api/specification';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { formatDate } from '@/utils/date';

interface SpecificationViewProps {
  specification: Specification;
  isLoading?: boolean;
  error?: string | null;
  onGenerateCode?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  className?: string;
}

const SpecificationView: React.FC<SpecificationViewProps> = ({
  specification,
  isLoading = false,
  error = null,
  onGenerateCode,
  onExport,
  onShare,
  className = '',
}) => {
  // State for active tab in requirements section
  const [activeRequirementsTab, setActiveRequirementsTab] = useState<'functional' | 'non-functional' | 'constraints'>('functional');

  // Helper to get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400';
      case 'medium':
        return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400';
      case 'low':
        return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400';
      default:
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300';
    }
  };

  // If loading
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-300">Loading specification...</p>
        </div>
      </div>
    );
  }

  // If error
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Card variant="outlined" className="max-w-md text-center">
          <div className="flex justify-center mb-4">
            <XCircleIcon className="h-12 w-12 text-error-500" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            Failed to load specification
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  // If no specification
  if (!specification) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <Card variant="outlined" className="max-w-md text-center">
          <div className="flex justify-center mb-4">
            <DocumentTextIcon className="h-12 w-12 text-neutral-400" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
            No specification found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            The requested specification could not be found or has been deleted.
          </p>
          <Button variant="primary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {specification.project_name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            <span>
              Created: {formatDate(specification.created_at)}
            </span>
            <span>
              Version: {specification.version}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {onGenerateCode && (
            <Button
              variant="primary"
              icon={<CodeBracketIcon className="h-5 w-5" />}
              onClick={onGenerateCode}
            >
              Generate Code
            </Button>
          )}
          {onExport && (
            <Button
              variant="outline"
              icon={<ArrowDownTrayIcon className="h-5 w-5" />}
              onClick={onExport}
            >
              Export
            </Button>
          )}
          {onShare && (
            <Button
              variant="outline"
              icon={<ShareIcon className="h-5 w-5" />}
              onClick={onShare}
            >
              Share
            </Button>
          )}
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Executive Summary
          </h2>
        </Card.Header>
        <Card.Body>
          <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
            {specification.content.executive_summary}
          </p>
        </Card.Body>
      </Card>

      {/* Requirements Tabs */}
      <Card>
        <Card.Header>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Requirements
            </h2>
            <div className="flex border border-neutral-200 dark:border-neutral-700 rounded-md overflow-hidden">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeRequirementsTab === 'functional'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setActiveRequirementsTab('functional')}
              >
                Functional
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeRequirementsTab === 'non-functional'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setActiveRequirementsTab('non-functional')}
              >
                Non-Functional
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeRequirementsTab === 'constraints'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
                onClick={() => setActiveRequirementsTab('constraints')}
              >
                Constraints
              </button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {/* Functional Requirements */}
          {activeRequirementsTab === 'functional' && (
            <div className="space-y-6">
              {specification.content.functional_requirements.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 italic">No functional requirements defined.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  {specification.content.functional_requirements.map((req: RequirementItem) => (
                    <div
                      key={req.id}
                      className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
                    >
                      <div className="bg-neutral-50 dark:bg-neutral-800 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {req.title}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                            req.priority
                          )}`}
                        >
                          {req.priority}
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-neutral-800">
                        <p className="text-neutral-700 dark:text-neutral-300">
                          {req.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Non-Functional Requirements */}
          {activeRequirementsTab === 'non-functional' && (
            <div className="space-y-6">
              {specification.content.non_functional_requirements.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 italic">No non-functional requirements defined.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  {specification.content.non_functional_requirements.map((req: NonFunctionalRequirement) => (
                    <div
                      key={req.id}
                      className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
                    >
                      <div className="bg-neutral-50 dark:bg-neutral-800 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">
                          {req.category}
                        </h3>
                      </div>
                      <div className="p-4 bg-white dark:bg-neutral-800">
                        <p className="text-neutral-700 dark:text-neutral-300 mb-3">
                          {req.description}
                        </p>
                        <div className="mt-2">
                          <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                            Acceptance Criteria:
                          </h4>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">
                            {req.acceptance_criteria}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Constraints */}
          {activeRequirementsTab === 'constraints' && (
            <div className="space-y-4">
              {specification.content.constraints.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400 italic">No constraints defined.</p>
              ) : (
                <ul className="space-y-2">
                  {specification.content.constraints.map((constraint) => (
                    <li
                      key={constraint.id}
                      className="flex items-start gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md"
                    >
                      <XCircleIcon className="h-5 w-5 text-error-500 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {constraint.description}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Tech Stack */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Technology Stack
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Frontend</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {specification.content.tech_stack.frontend}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Backend</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {specification.content.tech_stack.backend}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Database</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {specification.content.tech_stack.database}
              </p>
            </div>
            <div className="p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Deployment</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                {specification.content.tech_stack.deployment}
              </p>
            </div>
          </div>

          {specification.content.tech_stack.additional_services && 
           specification.content.tech_stack.additional_services.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                Additional Services
              </h3>
              <div className="flex flex-wrap gap-2">
                {specification.content.tech_stack.additional_services.map((service, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Milestones */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
            Project Milestones
          </h2>
        </Card.Header>
        <Card.Body>
          {specification.content.milestones.length === 0 ? (
            <p className="text-neutral-500 dark:text-neutral-400 italic">No milestones defined.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Milestone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Tasks
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Dependencies
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                  {specification.content.milestones.map((milestone: Milestone, index: number) => (
                    <tr key={milestone.id} className={index % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50 dark:bg-neutral-750'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {milestone.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
                        {milestone.duration}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-700 dark:text-neutral-300">
                        <ul className="list-disc list-inside">
                          {milestone.tasks.map((task, taskIndex) => (
                            <li key={taskIndex}>{task}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
                        {milestone.dependencies.length > 0 
                          ? milestone.dependencies.join(', ') 
                          : <span className="text-neutral-400 dark:text-neutral-500 italic">None</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Timeline and Budget */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Estimated Timeline
              </h2>
            </div>
          </Card.Header>
          <Card.Body>
            <p className="text-neutral-700 dark:text-neutral-300">
              {specification.content.estimated_timeline}
            </p>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Estimated Budget
              </h2>
            </div>
          </Card.Header>
          <Card.Body>
            <p className="text-neutral-700 dark:text-neutral-300">
              {specification.content.estimated_budget_range}
            </p>
          </Card.Body>
        </Card>
      </div>

      {/* Assumptions and Risks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Assumptions */}
        <Card>
          <Card.Header>
            <div className="flex items-center">
              <LightBulbIcon className="h-5 w-5 text-primary-500 mr-2" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Assumptions
              </h2>
            </div>
          </Card.Header>
          <Card.Body>
            {specification.content.assumptions.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 italic">No assumptions defined.</p>
            ) : (
              <ul className="space-y-2">
                {specification.content.assumptions.map((assumption, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-md"
                  >
                    <CheckCircleIcon className="h-5 w-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {assumption}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>

        {/* Risks */}
        <Card>
          <Card.Header>
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-warning-500 mr-2" />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Risks
              </h2>
            </div>
          </Card.Header>
          <Card.Body>
            {specification.content.risks.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 italic">No risks identified.</p>
            ) : (
              <div className="space-y-4">
                {specification.content.risks.map((risk: Risk, index: number) => (
                  <div
                    key={index}
                    className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
                  >
                    <div className="bg-neutral-50 dark:bg-neutral-800 px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100 truncate pr-2">
                        {risk.description}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                          risk.impact
                        )}`}
                      >
                        {risk.impact} Impact
                      </span>
                    </div>
                    <div className="p-4 bg-white dark:bg-neutral-800">
                      <div>
                        <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                          Mitigation Strategy:
                        </h4>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">
                          {risk.mitigation}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default SpecificationView;
