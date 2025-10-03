import { useState } from "react";
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
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export default function PlaygroundSimple() {
  // Basic state
  const [yaml, setYaml] = useState("");
  const [provider] = useState("Generic");
  const [securityChecks, setSecurityChecks] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [jsonOutput, setJsonOutput] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<"yaml" | "json" | null>(
    null
  );

  // Theme
  const { theme, setTheme } = useTheme();

  // Sample YAML
  const sampleYaml = `# Sample YAML
name: cloudlint-example
version: 1.0.0
description: A sample YAML file for testing

services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production

  database:
    image: postgres:13
    environment:
      - POSTGRES_DB=myapp
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:`;

  // Handlers
  const handleValidate = () => {
    if (!yaml.trim()) return;
    setIsValidating(true);

    // Simulate validation
    setTimeout(() => {
      setIsValidating(false);
      alert(
        "Validation complete! (This is a mock - backend integration needed)"
      );
    }, 1000);
  };

  const handleConvertToJson = () => {
    if (!yaml.trim()) return;

    try {
      // Simple mock conversion
      const mockJson = {
        message: "This is a mock JSON conversion",
        originalYaml: yaml.substring(0, 100) + "...",
        timestamp: new Date().toISOString(),
      };
      setJsonOutput(JSON.stringify(mockJson, null, 2));
    } catch (error) {
      setJsonOutput(`Error: ${error}`);
    }
  };

  const handleReset = () => {
    setYaml("");
    setJsonOutput(null);
  };

  const handleLoadSample = () => {
    setYaml(sampleYaml);
    setJsonOutput(null);
  };

  const handleCopyYaml = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopyFeedback("yaml");
      toast.success("YAML copied to clipboard!");
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (error) {
      console.error("Failed to copy YAML:", error);
      toast.error("Failed to copy YAML");
    }
  };

  const handleCopyJson = async () => {
    if (jsonOutput) {
      try {
        await navigator.clipboard.writeText(jsonOutput);
        setCopyFeedback("json");
        toast.success("JSON copied to clipboard!");
        setTimeout(() => setCopyFeedback(null), 2000);
      } catch (error) {
        console.error("Failed to copy JSON:", error);
        toast.error("Failed to copy JSON");
      }
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

        {/* Settings Row */}
        <section className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                {/* Provider Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Provider:</span>
                  <Badge variant="secondary">{provider}</Badge>
                </div>

                {/* Security Checks */}
                <div className="flex items-center gap-2">
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

              {/* Theme Toggle */}
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Output & Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="validation">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="validation">Validation</TabsTrigger>
                    <TabsTrigger value="json">JSON Output</TabsTrigger>
                  </TabsList>

                  <TabsContent value="validation" className="mt-4">
                    <div className="space-y-4">
                      {isValidating ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Validating YAML...
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Click "Validate" to check your YAML</p>
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
                disabled={!yaml.trim()}
                className="gap-2"
              >
                <FileJson className="h-4 w-4" />
                Convert to JSON
              </Button>

              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!yaml.trim() && !jsonOutput}
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
