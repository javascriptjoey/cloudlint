import { useState, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Copy,
  Download,
  FileJson,
  AlertCircle,
  CheckCircle,
  Moon,
  Sun,
  RefreshCw,
  FileText,
  Settings,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

type Provider = "Generic" | "AWS" | "Azure" | "GCP" | "Kubernetes";

interface ValidationMessage {
  message: string;
  severity: "error" | "warning" | "info";
  line?: number;
}

interface ValidationResult {
  ok: boolean;
  messages: ValidationMessage[];
  fixed?: string;
}

export default function PlaygroundNew() {
  // State management
  const [yaml, setYaml] = useState("");
  const [provider, setProvider] = useState<Provider>("Generic");
  const [securityChecks, setSecurityChecks] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Refs for file inputs
  const yamlFileRef = useRef<HTMLInputElement>(null);
  const schemaFileRef = useRef<HTMLInputElement>(null);

  // Theme management
  const { theme, setTheme } = useTheme();

  // Sample YAML content
  const sampleYaml = `# Sample CloudFormation Template
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Sample S3 bucket with versioning'

Resources:
  MyS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '\${AWS::StackName}-sample-bucket'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

Outputs:
  BucketName:
    Description: 'Name of the S3 bucket'
    Value: !Ref MyS3Bucket
    Export:
      Name: !Sub '\${AWS::StackName}-BucketName'`;

  // Event handlers
  const handleYamlUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!/\.ya?ml$/i.test(file.name)) {
      alert("Please select a .yaml or .yml file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setYaml(content);
    };
    reader.readAsText(file);
  };

  const handleSchemaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!/\.json$/i.test(file.name)) {
      alert("Please select a .json schema file.");
      return;
    }

    // TODO: Handle schema upload logic
    console.log("Schema upload:", file.name);
  };

  const handleValidate = async () => {
    if (!yaml.trim()) return;

    setIsValidating(true);

    // Simulate validation (replace with actual API call)
    setTimeout(() => {
      const mockResult: ValidationResult = {
        ok: Math.random() > 0.3,
        messages: [
          {
            message: "YAML syntax is valid",
            severity: "info",
            line: 1,
          },
          ...(Math.random() > 0.5
            ? [
                {
                  message:
                    "Consider adding resource tags for better organization",
                  severity: "warning" as const,
                  line: 8,
                },
              ]
            : []),
          ...(Math.random() > 0.7
            ? [
                {
                  message: "Missing required property: Description",
                  severity: "error" as const,
                  line: 12,
                },
              ]
            : []),
        ],
      };
      setValidationResult(mockResult);
      setIsValidating(false);
    }, 1000);
  };

  const handleConvertToJson = async () => {
    if (!yaml.trim()) return;

    setIsConverting(true);

    // Simulate conversion (replace with actual API call)
    setTimeout(() => {
      const mockJson = {
        AWSTemplateFormatVersion: "2010-09-09",
        Description: "Sample S3 bucket with versioning",
        Resources: {
          MyS3Bucket: {
            Type: "AWS::S3::Bucket",
            Properties: {
              BucketName: "${AWS::StackName}-sample-bucket",
              VersioningConfiguration: {
                Status: "Enabled",
              },
            },
          },
        },
      };
      setJsonOutput(JSON.stringify(mockJson, null, 2));
      setIsConverting(false);
    }, 500);
  };

  const handleApplyFixes = () => {
    if (validationResult?.fixed) {
      setYaml(validationResult.fixed);
      setValidationResult(null);
    }
  };

  const handleReset = () => {
    setYaml("");
    setValidationResult(null);
    setJsonOutput(null);
  };

  const handleLoadSample = () => {
    setYaml(sampleYaml);
    setValidationResult(null);
    setJsonOutput(null);
  };

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(yaml);
  };

  const handleDownloadYaml = () => {
    const blob = new Blob([yaml], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cloudlint.yaml";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    if (jsonOutput) {
      navigator.clipboard.writeText(jsonOutput);
    }
  };

  const handleDownloadJson = () => {
    if (jsonOutput) {
      const blob = new Blob([jsonOutput], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cloudlint.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

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

        {/* Provider & Settings Row */}
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* Provider Selection */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="provider-select"
                    className="text-sm font-medium"
                  >
                    Provider:
                  </label>
                  <Select
                    value={provider}
                    onValueChange={(value: Provider) => setProvider(value)}
                  >
                    <SelectTrigger id="provider-select" className="w-32">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Generic">Generic</SelectItem>
                      <SelectItem value="AWS">AWS</SelectItem>
                      <SelectItem value="Azure">Azure</SelectItem>
                      <SelectItem value="GCP">GCP</SelectItem>
                      <SelectItem value="Kubernetes">Kubernetes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Security Checks Toggle */}
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="security-toggle"
                    className="text-sm font-medium"
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

              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="gap-2"
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

        {/* Main Content - Split View */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Card: YAML Editor */}
            <Card className="flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      YAML Editor
                    </CardTitle>
                    <CardDescription>
                      Paste YAML content or upload a file
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyYaml}
                      disabled={!yaml.trim()}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadYaml}
                      disabled={!yaml.trim()}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <CodeMirrorYamlEditor
                  value={yaml}
                  onChange={setYaml}
                  placeholder="Paste YAML here..."
                  className="min-h-[400px]"
                />

                {/* Upload Buttons */}
                <div className="flex gap-2">
                  <input
                    ref={yamlFileRef}
                    type="file"
                    accept=".yaml,.yml"
                    onChange={handleYamlUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => yamlFileRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload YAML
                  </Button>

                  <input
                    ref={schemaFileRef}
                    type="file"
                    accept=".json"
                    onChange={handleSchemaUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => schemaFileRef.current?.click()}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Upload Schema
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right Card: Output/Feedback */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Output & Feedback
                </CardTitle>
                <CardDescription>
                  Validation results and converted output
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <Tabs defaultValue="errors" className="h-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="errors" className="gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Errors
                    </TabsTrigger>
                    <TabsTrigger value="json" className="gap-2">
                      <FileJson className="h-4 w-4" />
                      JSON
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="errors" className="mt-4 space-y-4">
                    {validationResult ? (
                      <div className="space-y-3">
                        {/* Validation Status */}
                        <div className="flex items-center gap-2">
                          {validationResult.ok ? (
                            <>
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                Valid YAML
                              </Badge>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-5 w-5 text-red-600" />
                              <Badge variant="destructive">
                                Validation Failed
                              </Badge>
                            </>
                          )}
                        </div>

                        {/* Messages */}
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {validationResult.messages.map((msg, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-md border text-sm ${
                                msg.severity === "error"
                                  ? "border-red-200 bg-red-50 text-red-800"
                                  : msg.severity === "warning"
                                    ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                                    : "border-blue-200 bg-blue-50 text-blue-800"
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <Badge
                                  variant={
                                    msg.severity === "error"
                                      ? "destructive"
                                      : msg.severity === "warning"
                                        ? "secondary"
                                        : "default"
                                  }
                                  className="text-xs"
                                >
                                  {msg.severity.toUpperCase()}
                                </Badge>
                                <div className="flex-1">
                                  <p>{msg.message}</p>
                                  {msg.line && (
                                    <p className="text-xs opacity-70 mt-1">
                                      Line {msg.line}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center space-y-2">
                          <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
                          <p>No validation results yet</p>
                          <p className="text-sm">
                            Click "Validate" to check your YAML
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="json" className="mt-4">
                    {jsonOutput ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Converted JSON</h4>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCopyJson}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownloadJson}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[300px]">
                          <code>{jsonOutput}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        <div className="text-center space-y-2">
                          <FileJson className="h-12 w-12 mx-auto opacity-50" />
                          <p>No JSON output yet</p>
                          <p className="text-sm">
                            Click "Convert to JSON" to see the result
                          </p>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={handleValidate}
                disabled={!yaml.trim() || isValidating}
                className="gap-2"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Validate
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={handleConvertToJson}
                disabled={!yaml.trim() || isConverting}
                className="gap-2"
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

              {validationResult?.fixed && (
                <Button
                  variant="default"
                  onClick={handleApplyFixes}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Apply Fixes
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!yaml.trim() && !validationResult && !jsonOutput}
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
                Sample YAML
              </Button>
            </div>
          </div>
        </section>

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
