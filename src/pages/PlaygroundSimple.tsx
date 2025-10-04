import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Seo } from "@/components/Seo";
import { CodeMirrorYamlEditor } from "@/components/CodeMirrorYamlEditor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy,
  FileJson,
  AlertCircle,
  CheckCircle,
  Moon,
  Sun,
  RefreshCw,
  FileText,
  Check,
  Wand2,
  Lightbulb,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

// Import our real backend hooks
import { useValidation } from "@/hooks/useValidation";
import { useProviderDetection } from "@/hooks/useProviderDetection";
import { useAutoFix } from "@/hooks/useAutoFix";
import { useSuggestions } from "@/hooks/useSuggestions";
import { api, ApiError } from "@/lib/apiClient";

export default function PlaygroundSimple() {
  // Core state
  const [yaml, setYaml] = useState("");
  const [securityChecks, setSecurityChecks] = useState(false);
  const [realTimeValidation, setRealTimeValidation] = useState(false);
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<"yaml" | "json" | null>(
    null
  );
  const [isConverting, setIsConverting] = useState(false);
  const [activeTab, setActiveTab] = useState<"validation" | "json">(
    "validation"
  );

  // Refs for smooth scrolling
  const resultsRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLElement>(null);

  // Theme
  const { theme, setTheme } = useTheme();

  // Provider detection with real backend integration
  const { provider, confidence } = useProviderDetection(yaml);

  // Memoize validation options to prevent unnecessary re-renders
  const validationOptions = useMemo(
    () => ({
      provider,
      securityChecks,
      realTime: realTimeValidation,
    }),
    [provider, securityChecks, realTimeValidation]
  );

  // Real-time validation with backend
  const validation = useValidation(yaml, validationOptions);

  // Auto-fix functionality
  const autoFix = useAutoFix();

  // Suggestions system
  const suggestions = useSuggestions(yaml, provider);

  // Smooth scroll utility function
  const scrollToResults = useCallback(() => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  // Sample YAML - CloudFormation template for better provider detection
  const sampleYaml = useMemo(
    () => `# AWS CloudFormation Template
AWSTemplateFormatVersion: '2010-09-09'
Description: Sample CloudFormation template for Cloudlint testing

Parameters:
  BucketName:
    Type: String
    Default: my-sample-bucket
    Description: Name for the S3 bucket

Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BucketName
      PublicReadPolicy: false
      VersioningConfiguration:
        Status: Enabled
      
  MyFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: my-sample-function
      Runtime: nodejs18.x
      Handler: index.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            return { 
              statusCode: 200, 
              body: JSON.stringify('Hello from Lambda!') 
            }
          }
      Environment:
        Variables:
          BUCKET_NAME: !Ref MyBucket

Outputs:
  BucketName:
    Description: Name of the created S3 bucket
    Value: !Ref MyBucket
    Export:
      Name: !Sub '\${AWS::StackName}-BucketName'`,
    []
  );

  // Debug: Log autoFix state changes
  useEffect(() => {
    console.log("🔄 AutoFix state changed:", {
      canApply: autoFix.canApply,
      diff: autoFix.diff ? "present" : "null",
      fixCount: autoFix.fixCount,
      hasChanges: autoFix.hasChanges(),
    });
  }, [autoFix.canApply, autoFix.diff, autoFix.fixCount, autoFix]);

  // Real backend handlers
  const handleValidate = useCallback(async () => {
    if (!yaml.trim()) {
      toast.error("Please enter some YAML content to validate");
      return;
    }

    try {
      // Get the result directly from validate() instead of reading from state
      const result = await validation.validate();

      if (!result) {
        // Validation was cancelled or returned null
        return;
      }

      // Count messages by severity
      const errorCount = result.messages.filter(
        (m: { severity: string }) => m.severity === "error"
      ).length;
      const warningCount = result.messages.filter(
        (m: { severity: string }) => m.severity === "warning"
      ).length;
      const infoCount = result.messages.filter(
        (m: { severity: string }) => m.severity === "info"
      ).length;

      // Show appropriate toast based on actual errors/warnings
      if (errorCount > 0) {
        // Has errors - validation failed
        toast.error(
          `❌ Validation failed: ${errorCount} error${errorCount !== 1 ? "s" : ""}${warningCount > 0 ? `, ${warningCount} warning${warningCount !== 1 ? "s" : ""}` : ""}`
        );
      } else if (warningCount > 0) {
        // No errors but has warnings - validation passed with warnings
        toast.warning(
          `⚠️ Validation passed with ${warningCount} warning${warningCount !== 1 ? "s" : ""}${infoCount > 0 ? ` and ${infoCount} info message${infoCount !== 1 ? "s" : ""}` : ""}`
        );
      } else if (infoCount > 0) {
        // Only info messages - validation successful
        toast.info(
          `ℹ️ Validation successful with ${infoCount} info message${infoCount !== 1 ? "s" : ""}`
        );
      } else {
        // No messages at all - perfect!
        toast.success(`✅ Validation successful! No issues found`);
      }

      // Smooth scroll to results after a brief delay for toast to appear
      setTimeout(() => {
        scrollToResults();
      }, 300);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Validation failed";
      toast.error(`Validation error: ${message}`);
    }
  }, [yaml, validation, scrollToResults]);

  const handleConvertToJson = useCallback(async () => {
    if (!yaml.trim()) {
      toast.error("Please enter some YAML content to convert");
      return;
    }

    setIsConverting(true);
    try {
      const result = await api.convert({ yaml });
      setJsonOutput(result.json || "{}");
      setActiveTab("json"); // Auto-switch to JSON tab
      toast.success("✅ YAML converted to JSON successfully!");

      // Scroll to results after switching tabs
      setTimeout(() => {
        scrollToResults();
      }, 100);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Conversion failed";
      setJsonOutput(`Error: ${message}`);
      toast.error(`Conversion error: ${message}`);
    } finally {
      setIsConverting(false);
    }
  }, [yaml, scrollToResults]);

  const handleAutoFix = useCallback(async () => {
    if (!yaml.trim()) {
      toast.error("Please enter some YAML content to fix");
      return;
    }

    try {
      const result = await autoFix.generateFix(yaml, { spectralFix: true });

      console.log("🎯 Auto-fix result:", {
        hasChanges: result?.hasChanges,
        fixesApplied: result?.fixesApplied,
        hasDiff: !!result?.diff,
        canApply: autoFix.canApply,
        diff: autoFix.diff,
      });

      if (result?.hasChanges) {
        toast.success(
          `🔧 Auto-fix complete! Applied ${result.fixesApplied.length} fixes. Review changes below.`
        );
        // Scroll to diff preview after a brief delay
        setTimeout(() => {
          const diffSection = document.querySelector(
            '[data-testid="autofix-diff-preview"]'
          );
          if (diffSection) {
            diffSection.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
            });
          }
        }, 300);
      } else {
        toast.info("✨ No fixes needed - your YAML looks good!");
      }
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Auto-fix failed";
      toast.error(`Auto-fix error: ${message}`);
    }
  }, [yaml, autoFix]);

  const handleApplyAutoFix = useCallback(() => {
    const fixedContent = autoFix.getFixedContent();
    if (fixedContent) {
      setYaml(fixedContent);
      autoFix.clearAutoFix();
      toast.success("✅ Auto-fix applied successfully!");
    }
  }, [autoFix]);

  const handleLoadSuggestions = useCallback(async () => {
    if (!yaml.trim()) {
      toast.error("Please enter some YAML content to analyze");
      return;
    }

    try {
      await suggestions.loadSuggestions();

      if (suggestions.hasSuggestions) {
        const stats = suggestions.getSuggestionStats();
        toast.success(
          `💡 Found ${stats.total} suggestions (${stats.highConfidence} high confidence)`
        );
      } else {
        toast.info("✨ No suggestions needed - your YAML looks great!");
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Failed to load suggestions";
      toast.error(`Suggestions error: ${message}`);
    }
  }, [yaml, suggestions]);

  const handleReset = useCallback(() => {
    setYaml("");
    setJsonOutput(null);
    validation.clearValidation();
    autoFix.clearAutoFix();
    suggestions.clearSuggestions();
    toast.info("🔄 Reset complete");
  }, [validation, autoFix, suggestions]);

  const handleLoadSample = useCallback(() => {
    setYaml(sampleYaml);
    setJsonOutput(null);
    toast.info("📝 Sample YAML loaded");
  }, [sampleYaml]);

  const handleCopyYaml = useCallback(async () => {
    if (!yaml.trim()) {
      toast.error("No YAML content to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(yaml);
      setCopyFeedback("yaml");
      toast.success("📋 YAML copied to clipboard!");
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      console.error("Failed to copy YAML:", error);
      toast.error("Failed to copy YAML");
    }
  }, [yaml]);

  const handleCopyJson = useCallback(async () => {
    if (!jsonOutput) {
      toast.error("No JSON content to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(jsonOutput);
      setCopyFeedback("json");
      toast.success("📋 JSON copied to clipboard!");
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      console.error("Failed to copy JSON:", error);
      toast.error("Failed to copy JSON");
    }
  }, [jsonOutput]);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return (
    <>
      <Seo
        title="Cloudlint • YAML Playground"
        description="Validate and auto-fix YAML optimized for AWS, Azure, and more"
        canonical="https://cloudlint.local/playground"
        ogTitle="Cloudlint YAML Playground"
        ogDescription="Professional YAML validation with provider-specific optimizations"
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">
                Cloudlint YAML Validator
              </h1>
              <p className="text-xl text-muted-foreground">
                Validate and auto-fix YAML optimized for AWS, Azure, and more
              </p>
            </div>
          </div>
        </section>

        {/* Settings Row */}
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            {/* Mobile: Stack in rows, Desktop: Single row */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              {/* Top row on mobile: Provider, Real-time, Security Checks */}
              <div className="flex items-center justify-between gap-2 md:gap-6">
                {/* Provider Badge with Confidence - Left with padding */}
                <div className="flex items-center gap-2 pl-2 md:pl-0">
                  <span className="text-sm font-medium">Provider:</span>
                  <Badge
                    variant={
                      confidence > 0.8
                        ? "default"
                        : confidence > 0.5
                          ? "secondary"
                          : "outline"
                    }
                    className="capitalize"
                    style={
                      provider === "aws" && confidence > 0.5
                        ? {
                            backgroundColor: "rgb(255, 153, 0)",
                            color: "rgb(35, 47, 62)",
                            borderColor: "rgb(255, 153, 0)",
                          }
                        : provider === "azure" && confidence > 0.5
                          ? {
                              backgroundColor: "rgb(0, 120, 212)",
                              color: "white",
                              borderColor: "rgb(0, 120, 212)",
                            }
                          : undefined
                    }
                  >
                    {provider}
                    {confidence > 0 && (
                      <span className="ml-1 text-xs opacity-75">
                        ({Math.round(confidence * 100)}%)
                      </span>
                    )}
                  </Badge>
                </div>

                {/* Real-time Validation - Center */}
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <label
                    htmlFor="realtime-toggle"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Real-time:
                  </label>
                  <Switch
                    id="realtime-toggle"
                    checked={realTimeValidation}
                    onCheckedChange={setRealTimeValidation}
                  />
                  <span className="text-sm text-muted-foreground">
                    {realTimeValidation ? "On" : "Off"}
                  </span>
                </div>

                {/* Security Checks - Right with padding */}
                <div className="flex items-center gap-2 whitespace-nowrap pr-2 md:pr-0">
                  <label
                    htmlFor="security-toggle"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Security Checks:
                  </label>
                  <Switch
                    id="security-toggle"
                    checked={securityChecks}
                    onCheckedChange={setSecurityChecks}
                  />
                  <span className="text-sm text-muted-foreground">
                    {securityChecks ? "On" : "Off"}
                  </span>
                </div>
              </div>

              {/* Bottom row on mobile: Dark Mode aligned with Provider */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="gap-2 self-start pl-2 md:self-auto md:pl-3"
              >
                {theme === "light" ? (
                  <>
                    <Moon className="h-4 w-4" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4" />
                    Light Mode
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* YAML Editor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      YAML Editor
                    </CardTitle>
                    <CardDescription>
                      Paste YAML content or load a sample
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyYaml}
                      disabled={!yaml.trim()}
                      className={
                        copyFeedback === "yaml"
                          ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
                          : ""
                      }
                    >
                      {copyFeedback === "yaml" ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeMirrorYamlEditor
                  value={yaml}
                  onChange={setYaml}
                  placeholder="Paste YAML here or click 'Load Sample' below..."
                  className="min-h-[400px]"
                />
              </CardContent>
            </Card>

            {/* Output */}
            <Card ref={resultsRef}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Output & Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={activeTab}
                  onValueChange={(value) =>
                    setActiveTab(value as "validation" | "json")
                  }
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="validation">Validation</TabsTrigger>
                    <TabsTrigger value="json">JSON Output</TabsTrigger>
                  </TabsList>

                  <TabsContent value="validation" className="mt-4">
                    <div className="space-y-4">
                      {validation.isValidating ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Validating YAML...
                        </div>
                      ) : validation.error ? (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">{validation.error}</span>
                        </div>
                      ) : validation.results ? (
                        <div className="space-y-4">
                          {/* Validation Summary */}
                          <div className="flex items-center gap-2">
                            {validation.results.ok ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span
                              className={`font-medium ${validation.results.ok ? "text-green-600" : "text-red-600"}`}
                            >
                              {validation.results.ok
                                ? "Valid YAML"
                                : "Validation Failed"}
                            </span>
                            <div className="flex gap-2 ml-auto">
                              {validation.errorCount > 0 && (
                                <Badge variant="destructive">
                                  {validation.errorCount} errors
                                </Badge>
                              )}
                              {validation.warningCount > 0 && (
                                <Badge variant="secondary">
                                  {validation.warningCount} warnings
                                </Badge>
                              )}
                              {validation.infoCount > 0 && (
                                <Badge variant="outline">
                                  {validation.infoCount} info
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Validation Messages */}
                          {validation.results.messages.length > 0 && (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {validation.results.messages.map(
                                (message, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded-md text-sm ${
                                      message.severity === "error"
                                        ? "bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500"
                                        : message.severity === "warning"
                                          ? "bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500"
                                          : "bg-blue-50 dark:bg-blue-950/20 border-l-4 border-blue-500"
                                    }`}
                                  >
                                    <div className="flex items-start gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {message.source}
                                      </Badge>
                                      <div className="flex-1">
                                        <p className="font-medium">
                                          {message.message}
                                        </p>
                                        {(message.line || message.column) && (
                                          <p className="text-xs opacity-75 mt-1">
                                            Line {message.line}
                                            {message.column
                                              ? `, Column ${message.column}`
                                              : ""}
                                            {message.ruleId &&
                                              ` • Rule: ${message.ruleId}`}
                                          </p>
                                        )}
                                        {message.suggestion && (
                                          <p className="text-xs mt-1 italic">
                                            💡 {message.suggestion}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          {/* Provider Summary */}
                          {validation.results.providerSummary && (
                            <div className="text-xs text-muted-foreground border-t pt-2">
                              <p>
                                Validated as{" "}
                                {validation.results.providerSummary.provider.toUpperCase()}{" "}
                                using:{" "}
                                {Object.keys(
                                  validation.results.providerSummary.counts
                                ).join(", ")}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>
                            {realTimeValidation
                              ? "Real-time validation enabled - results will appear as you type"
                              : "Click 'Validate' to check your YAML"}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="json" className="mt-4">
                    {jsonOutput ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">JSON Output</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopyJson}
                            className={
                              copyFeedback === "json"
                                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-300"
                                : ""
                            }
                          >
                            {copyFeedback === "json" ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[300px]">
                          <code>{jsonOutput}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileJson className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Click "Convert to JSON" to see output</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Action Buttons - Sticky for better UX */}
        <section
          ref={actionsRef}
          className="sticky bottom-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-lg"
        >
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              {/* Primary Actions */}
              <Button
                onClick={handleValidate}
                disabled={
                  !yaml.trim() || validation.isValidating || realTimeValidation
                }
                className="gap-2"
              >
                {validation.isValidating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {realTimeValidation ? "Real-time Active" : "Validate"}
                    {validation.hasErrors && validation.errors?.length > 0 && (
                      <Badge variant="destructive" className="ml-1">
                        {validation.errors.length}
                      </Badge>
                    )}
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={handleConvertToJson}
                disabled={!yaml.trim() || isConverting || validation.hasErrors}
                className="gap-2"
                title={
                  validation.hasErrors
                    ? "Fix validation errors before converting"
                    : "Convert YAML to JSON"
                }
              >
                {isConverting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <FileJson className="h-4 w-4" />
                    Convert to JSON
                  </>
                )}
              </Button>

              {/* Advanced Actions */}
              <Button
                variant="outline"
                onClick={handleAutoFix}
                disabled={!yaml.trim() || autoFix.isFixing}
                className="gap-2"
              >
                {autoFix.isFixing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Auto-fix
                  </>
                )}
              </Button>

              {autoFix.canApply && (
                <Button
                  variant="default"
                  onClick={handleApplyAutoFix}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-4 w-4" />
                  Apply Fix ({autoFix.fixCount} changes)
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleLoadSuggestions}
                disabled={!yaml.trim() || suggestions.isLoading}
                className="gap-2"
              >
                {suggestions.isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Lightbulb className="h-4 w-4" />
                    Suggestions
                    {suggestions.hasSuggestions && (
                      <Badge variant="secondary" className="ml-1">
                        {suggestions.suggestions.length}
                      </Badge>
                    )}
                  </>
                )}
              </Button>

              {/* View Results Button - appears after validation */}
              {validation.hasResults && (
                <Button
                  variant="outline"
                  onClick={scrollToResults}
                  className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <AlertCircle className="h-4 w-4" />
                  View Results
                  {validation.hasErrors && (
                    <Badge variant="destructive" className="ml-1">
                      {validation.errorCount}
                    </Badge>
                  )}
                  {!validation.hasErrors && validation.warningCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {validation.warningCount}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Utility Actions */}
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!yaml.trim() && !jsonOutput && !validation.hasResults}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </Button>

              <Button
                variant="outline"
                onClick={handleLoadSample}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Load Sample
              </Button>
            </div>
          </div>
        </section>

        {/* Auto-fix Diff Preview - show when fixes are available */}
        {(autoFix.canApply || autoFix.diff) && (
          <section
            className="border-t bg-muted/20"
            data-testid="autofix-diff-preview"
          >
            <div className="container mx-auto px-4 py-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Auto-fix Preview
                  </CardTitle>
                  <CardDescription>
                    Review the changes before applying them to your YAML
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Fix Summary */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {autoFix.fixCount} fixes available
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {autoFix.fixesApplied.join(", ")}
                      </div>
                    </div>

                    {/* Diff Display */}
                    <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-64 font-mono">
                      <code>{autoFix.diff}</code>
                    </pre>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button onClick={handleApplyAutoFix} className="gap-2">
                        <Check className="h-4 w-4" />
                        Apply Changes
                      </Button>
                      <Button variant="outline" onClick={autoFix.clearAutoFix}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Suggestions */}
        {suggestions.hasSuggestions && (
          <section className="border-t bg-muted/20">
            <div className="container mx-auto px-4 py-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Suggestions ({suggestions.provider.toUpperCase()})
                  </CardTitle>
                  <CardDescription>
                    Provider-specific suggestions to improve your YAML
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Suggestion Stats */}
                    <div className="flex gap-2">
                      {(() => {
                        const stats = suggestions.getSuggestionStats();
                        return (
                          <>
                            <Badge variant="default">{stats.total} total</Badge>
                            {stats.highConfidence > 0 && (
                              <Badge variant="secondary">
                                {stats.highConfidence} high confidence
                              </Badge>
                            )}
                            {stats.byKind.rename > 0 && (
                              <Badge variant="outline">
                                {stats.byKind.rename} renames
                              </Badge>
                            )}
                            {stats.byKind.add > 0 && (
                              <Badge variant="outline">
                                {stats.byKind.add} additions
                              </Badge>
                            )}
                            {stats.byKind.type > 0 && (
                              <Badge variant="outline">
                                {stats.byKind.type} type fixes
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    {/* Suggestions List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {suggestions
                        .getSuggestionsByConfidence()
                        .map(({ suggestion, index }) => (
                          <div
                            key={index}
                            className="p-3 rounded-md border bg-background"
                          >
                            <div className="flex items-start gap-2">
                              <Badge
                                variant={
                                  suggestion.kind === "rename"
                                    ? "default"
                                    : suggestion.kind === "add"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="text-xs"
                              >
                                {suggestion.kind}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {suggestion.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Path: {suggestion.path}
                                  {suggestion.confidence && (
                                    <span className="ml-2">
                                      Confidence:{" "}
                                      {Math.round(suggestion.confidence * 100)}%
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Suggestion Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          suggestions.applyHighConfidenceSuggestions(0.8)
                        }
                        disabled={
                          !suggestions.hasHighConfidenceSuggestions ||
                          suggestions.application.isApplying
                        }
                        className="gap-2"
                      >
                        {suggestions.application.isApplying ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            Apply High Confidence
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={suggestions.clearSuggestions}
                      >
                        Clear Suggestions
                      </Button>
                    </div>

                    {/* Applied Suggestions Result */}
                    {suggestions.application.newContent && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                        <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                          ✅ Suggestions applied! Click below to use the updated
                          YAML:
                        </p>
                        <Button
                          size="sm"
                          onClick={() => {
                            setYaml(suggestions.application.newContent!);
                            suggestions.clearSuggestions();
                            toast.success("Updated YAML applied!");
                          }}
                        >
                          Use Updated YAML
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Documentation Links */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Documentation</h3>
              <div className="flex flex-wrap items-center justify-center gap-6">
                <a
                  href="https://github.com/javascriptjoey/cloudlint/blob/main/docs/API.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  API Reference
                </a>
                <a
                  href="https://github.com/javascriptjoey/cloudlint/blob/main/docs/secure-yaml.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Secure YAML Docs
                </a>
                <a
                  href="https://github.com/javascriptjoey/cloudlint/blob/main/docs/yaml-tooling.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  YAML Tooling Docs
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
