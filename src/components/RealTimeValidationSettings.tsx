import { useState } from 'react'
import { Settings, Clock, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'

interface RealTimeValidationSettingsProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  isPending?: boolean
  lastValidatedLength?: number
}

export function RealTimeValidationSettings({
  enabled,
  onEnabledChange,
  isPending = false,
  lastValidatedLength = 0
}: RealTimeValidationSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 gap-2"
          aria-label="Real-time validation settings"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Real-time</span>
          {isPending && (
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" 
                 aria-label="Validation pending" />
          )}
          {enabled && !isPending && (
            <div className="h-2 w-2 rounded-full bg-green-500" 
                 aria-label="Real-time validation enabled" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Real-time Validation
            </CardTitle>
            <CardDescription className="text-xs">
              Automatically validate YAML as you type with smart debouncing
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-center space-x-2">
              <Switch 
                id="real-time-validation"
                checked={enabled}
                onCheckedChange={onEnabledChange}
              />
              <Label 
                htmlFor="real-time-validation" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable real-time validation
              </Label>
            </div>
            
            {enabled && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Smart debouncing active</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Short content:</span>
                    <span className="font-medium">500ms delay</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Long content:</span>
                    <span className="font-medium">up to 1.5s delay</span>
                  </div>
                </div>
                
                {lastValidatedLength > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Last validated:</span>
                      <span className="font-medium">{lastValidatedLength} characters</span>
                    </div>
                  </div>
                )}
                
                {isPending && (
                  <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 rounded-md p-2 mt-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                    <span>Validation will trigger soon...</span>
                  </div>
                )}
              </div>
            )}
            
            {!enabled && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p>When disabled, use the Validate button to check your YAML manually.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}