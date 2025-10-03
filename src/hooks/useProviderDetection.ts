import { useState, useEffect, useMemo } from "react";

export type YamlProvider = "aws" | "azure" | "generic";

export interface ProviderDetectionResult {
  provider: YamlProvider;
  confidence: number;
  reasons: string[];
}

/**
 * Custom hook for automatic YAML provider detection
 *
 * Uses heuristics to detect:
 * - AWS CloudFormation templates
 * - Azure Pipelines YAML
 * - Generic YAML files
 *
 * @param yaml - The YAML content to analyze
 * @param forceProvider - Optional provider override
 * @returns Provider detection result with confidence score
 *
 * @example
 * ```typescript
 * const { provider, confidence, reasons } = useProviderDetection(yaml)
 *
 * if (provider === 'aws' && confidence > 0.8) {
 *   // High confidence AWS CloudFormation template
 *   enableCloudFormationFeatures()
 * }
 * ```
 */
export function useProviderDetection(
  yaml: string,
  forceProvider?: YamlProvider
): ProviderDetectionResult {
  const [detection, setDetection] = useState<ProviderDetectionResult>({
    provider: "generic",
    confidence: 0,
    reasons: [],
  });

  // Memoized detection logic to avoid recalculation
  const detectionResult = useMemo(() => {
    if (forceProvider) {
      return {
        provider: forceProvider,
        confidence: 1.0,
        reasons: ["Provider manually specified"],
      };
    }

    if (!yaml.trim()) {
      return {
        provider: "generic" as YamlProvider,
        confidence: 0,
        reasons: ["No content to analyze"],
      };
    }

    return detectProvider(yaml);
  }, [yaml, forceProvider]);

  useEffect(() => {
    setDetection(detectionResult);
  }, [detectionResult]);

  return detection;
}

/**
 * Core provider detection logic
 */
function detectProvider(yamlContent: string): ProviderDetectionResult {
  const content = yamlContent.toLowerCase();
  // const lines = yamlContent.split("\n"); // Reserved for future line-based analysis

  let awsScore = 0;
  let azureScore = 0;
  const reasons: string[] = [];

  // AWS CloudFormation Detection
  if (content.includes("awstemplateformatversion")) {
    awsScore += 50;
    reasons.push("Contains AWSTemplateFormatVersion");
  }

  if (content.includes("resources:") && content.includes("type: aws::")) {
    awsScore += 40;
    reasons.push("Contains AWS resource types");
  }

  if (content.includes("resources:") && !content.includes("steps:")) {
    awsScore += 20;
    reasons.push(
      "Has Resources section without Steps (CloudFormation pattern)"
    );
  }

  // Check for common AWS resource types
  const awsResourceTypes = [
    "aws::s3::bucket",
    "aws::lambda::function",
    "aws::ec2::instance",
    "aws::iam::role",
    "aws::rds::dbinstance",
    "aws::cloudformation::stack",
  ];

  awsResourceTypes.forEach((resourceType) => {
    if (content.includes(resourceType)) {
      awsScore += 10;
      reasons.push(`Contains ${resourceType}`);
    }
  });

  // Check for CloudFormation intrinsic functions
  const cfnFunctions = ["!ref", "!getatt", "!sub", "!join", "!split"];
  cfnFunctions.forEach((func) => {
    if (content.includes(func)) {
      awsScore += 5;
      reasons.push(`Uses CloudFormation function ${func}`);
    }
  });

  // Azure Pipelines Detection
  if (content.includes("trigger:") || content.includes("pr:")) {
    azureScore += 30;
    reasons.push("Contains Azure Pipelines trigger configuration");
  }

  if (
    content.includes("steps:") &&
    (content.includes("script:") || content.includes("task:"))
  ) {
    azureScore += 40;
    reasons.push("Contains Azure Pipelines steps with script/task");
  }

  if (content.includes("jobs:") && content.includes("steps:")) {
    azureScore += 30;
    reasons.push("Contains Azure Pipelines jobs and steps structure");
  }

  if (content.includes("stages:") && content.includes("jobs:")) {
    azureScore += 25;
    reasons.push("Contains Azure Pipelines stages and jobs structure");
  }

  // Check for common Azure Pipelines tasks
  const azureTasks = [
    "azurecli@",
    "azurepowershell@",
    "azureresourcemanagertemplate@",
    "dockerbuild@",
    "kubernetesmanifest@",
  ];

  azureTasks.forEach((task) => {
    if (content.includes(task)) {
      azureScore += 10;
      reasons.push(`Contains Azure task ${task}`);
    }
  });

  // Check for Azure-specific keywords
  if (
    content.includes("pool:") &&
    (content.includes("vmimage:") || content.includes("name:"))
  ) {
    azureScore += 15;
    reasons.push("Contains Azure Pipelines pool configuration");
  }

  // Variables section is common in Azure Pipelines
  if (content.includes("variables:") && content.includes("steps:")) {
    azureScore += 10;
    reasons.push("Contains variables with steps (Azure pattern)");
  }

  // Determine provider based on scores
  const maxScore = Math.max(awsScore, azureScore);

  if (maxScore === 0) {
    return {
      provider: "generic",
      confidence: 0.5,
      reasons: ["No specific provider patterns detected"],
    };
  }

  if (awsScore > azureScore) {
    return {
      provider: "aws",
      confidence: Math.min(awsScore / 100, 1.0),
      reasons,
    };
  } else if (azureScore > awsScore) {
    return {
      provider: "azure",
      confidence: Math.min(azureScore / 100, 1.0),
      reasons,
    };
  } else {
    // Tie-breaker: check for more specific patterns
    if (content.includes("awstemplateformatversion")) {
      return {
        provider: "aws",
        confidence: 0.9,
        reasons: [...reasons, "AWSTemplateFormatVersion is definitive"],
      };
    }

    return {
      provider: "generic",
      confidence: 0.3,
      reasons: [...reasons, "Ambiguous provider patterns detected"],
    };
  }
}

/**
 * Utility function for manual provider detection
 */
export function detectProviderSync(
  yamlContent: string
): ProviderDetectionResult {
  return detectProvider(yamlContent);
}

/**
 * Check if content is likely a CloudFormation template
 */
export function isLikelyCloudFormation(yamlContent: string): boolean {
  const detection = detectProvider(yamlContent);
  return detection.provider === "aws" && detection.confidence > 0.7;
}

/**
 * Check if content is likely an Azure Pipelines file
 */
export function isLikelyAzurePipelines(yamlContent: string): boolean {
  const detection = detectProvider(yamlContent);
  return detection.provider === "azure" && detection.confidence > 0.7;
}
