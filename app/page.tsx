'use client';

import { useState } from 'react';
import { Upload, FileText, Download, RefreshCw, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { SettingsButton } from '@/components/settings-button';
import { ApiKeyModal } from '@/components/api-key-modal';
import { parseFile } from '@/lib/file-parser';
import { summarizeText } from '@/lib/openai';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [summaryLength, setSummaryLength] = useState('medium');
  const [summaryFormat, setSummaryFormat] = useState('paragraphs');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const { toast } = useToast();

  const resetAll = () => {
    setInputText('');
    setSummary('');
    setSummaryLength('medium');
    setSummaryFormat('paragraphs');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Summary copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleTextSubmit = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to summarize",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await summarizeText(inputText, summaryLength as 'short' | 'medium' | 'detailed', summaryFormat);
      setSummary(result || '');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate summary",
        variant: "destructive"
      });
      if (error.message === 'OpenAI not initialized') {
        setShowApiKeyModal(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await parseFile(file);
      setInputText(text);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to read file",
        variant: "destructive"
      });
    }
  };

  const downloadSummary = async (format: 'txt' | 'docx') => {
    try {
      if (format === 'txt') {
        const element = document.createElement('a');
        const file = new Blob([summary], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = 'summary.txt';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else {
        const { Document, Packer, Paragraph, TextRun } = await import('docx');
        
        // Create document with proper formatting
        const doc = new Document({
          sections: [{
            properties: {},
            children: summary.split('\n').map(text => 
              new Paragraph({
                children: [new TextRun({ text: text.trim() })]
              })
            )
          }]
        });

        // Generate and download blob
        const blob = await Packer.toBlob(doc);
        const element = document.createElement('a');
        element.href = URL.createObjectURL(blob);
        element.download = 'summary.docx';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download summary",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SettingsButton onClick={() => setShowApiKeyModal(true)} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">AI Text Summarizer</h1>
            <p className="text-muted-foreground">
              Transform long texts into concise summaries using AI
            </p>
          </div>

          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text">
                <FileText className="w-4 h-4 mr-2" />
                Text Input
              </TabsTrigger>
              <TabsTrigger value="file">
                <Upload className="w-4 h-4 mr-2" />
                File Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <Card className="p-6">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Paste your text here..."
                    className="min-h-[200px]"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="file">
              <Card className="p-6">
                <div className="space-y-4">
                  <Label htmlFor="file">Upload .txt or .docx file</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".txt,.docx"
                    onChange={handleFileUpload}
                  />
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-4 items-end">
            <div className="space-y-2 flex-1">
              <Label>Summary Length</Label>
              <Select value={summaryLength} onValueChange={setSummaryLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex-1">
              <Label>Format</Label>
              <Select value={summaryFormat} onValueChange={setSummaryFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paragraphs">Paragraphs</SelectItem>
                  <SelectItem value="bullets">Bullet Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleTextSubmit}
              disabled={!inputText || isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? 'Processing...' : 'Summarize'}
            </Button>
          </div>

          {summary && (
            <Card className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Summary</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {isCopied ? (
                      <Check className="w-4 h-4 mr-2" />
                    ) : (
                      <Copy className="w-4 h-4 mr-2" />
                    )}
                    {isCopied ? 'Copied!' : 'Copy'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadSummary('txt')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download TXT
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadSummary('docx')}>
                    <Download className="w-4 h-4 mr-2" />
                    Download DOCX
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetAll}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">{summary}</p>
            </Card>
          )}
        </div>
      </main>

      <ApiKeyModal
        open={showApiKeyModal}
        onOpenChange={setShowApiKeyModal}
        onSuccess={() => {
          setShowApiKeyModal(false);
          if (inputText) {
            handleTextSubmit();
          }
        }}
      />
    </div>
  );
}