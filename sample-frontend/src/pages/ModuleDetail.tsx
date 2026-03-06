import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  BookOpen, Clock, Award, ChevronLeft, Play, ExternalLink, 
  Youtube, FileText, Globe, CheckCircle2, Circle, Download, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { mockModuleContent, type ModuleContent } from "@/mocks/moduleContent";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const ModuleDetail = () => {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [moduleContent, setModuleContent] = useState<ModuleContent | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!moduleId) {
      navigate("/learning-path");
      return;
    }

    // Decode the module ID from URL
    const decodedModuleId = decodeURIComponent(moduleId);
    
    // Find module content
    const content = mockModuleContent[decodedModuleId];
    
    if (content) {
      setModuleContent(content);
      // Select first lesson by default
      if (content.lessons.length > 0) {
        setSelectedLesson(content.lessons[0].id);
      }
    }
    
    setLoading(false);
  }, [moduleId, navigate]);

  // Export to PDF function
  const exportToPDF = () => {
    if (!moduleContent) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add text with word wrap
      const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        
        const lines = doc.splitTextToSize(text, maxWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += fontSize * 0.5;
        });
        
        yPosition += 5; // Add spacing after text block
      };

      // Title
      addText(moduleContent.title, 20, true);
      addText(moduleContent.description, 12);
      addText(`Duration: ${moduleContent.duration} | Difficulty: ${moduleContent.difficulty}`, 10);
      yPosition += 10;

      // Lessons
      addText("Lessons", 16, true);
      moduleContent.lessons.forEach((lesson, index) => {
        addText(`${index + 1}. ${lesson.title}`, 14, true);
        
        // Clean markdown content for PDF
        const cleanContent = lesson.content
          .replace(/#{1,6}\s/g, '') // Remove markdown headers
          .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.+?)\*/g, '$1') // Remove italic
          .replace(/`{3}[\s\S]*?`{3}/g, '[Code Block]') // Replace code blocks
          .replace(/`(.+?)`/g, '$1') // Remove inline code
          .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Remove links
        
        addText(cleanContent.substring(0, 500) + '...', 10); // Limit content length
        yPosition += 5;
      });

      // Resources
      if (moduleContent.resources.length > 0) {
        yPosition += 10;
        addText("Resources", 16, true);
        moduleContent.resources.forEach((resource) => {
          addText(`• ${resource.title} (${resource.type})`, 10);
          addText(`  ${resource.url}`, 9);
        });
      }

      // YouTube Videos
      if (moduleContent.youtubeVideos.length > 0) {
        yPosition += 10;
        addText("YouTube Videos", 16, true);
        moduleContent.youtubeVideos.forEach((video) => {
          addText(`• ${video.title} by ${video.channel}`, 10);
          addText(`  https://www.youtube.com/watch?v=${video.videoId}`, 9);
        });
      }

      // Web Content
      if (moduleContent.webScrapedContent.length > 0) {
        yPosition += 10;
        addText("Articles & Tutorials", 16, true);
        moduleContent.webScrapedContent.forEach((article) => {
          addText(`• ${article.title}`, 10);
          addText(`  ${article.url}`, 9);
        });
      }

      // Save PDF
      doc.save(`${moduleContent.title.replace(/\s+/g, '_')}_notes.pdf`);
      
      toast({
        title: "PDF Exported",
        description: "Your notes have been downloaded as PDF",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy content to clipboard
  const copyToClipboard = () => {
    if (!moduleContent) return;

    try {
      let content = `${moduleContent.title}\n${'='.repeat(moduleContent.title.length)}\n\n`;
      content += `${moduleContent.description}\n\n`;
      content += `Duration: ${moduleContent.duration} | Difficulty: ${moduleContent.difficulty}\n\n`;
      
      content += `LESSONS\n${'='.repeat(50)}\n\n`;
      moduleContent.lessons.forEach((lesson, index) => {
        content += `${index + 1}. ${lesson.title}\n`;
        content += `${'-'.repeat(lesson.title.length + 3)}\n`;
        content += `${lesson.content}\n\n`;
      });

      if (moduleContent.resources.length > 0) {
        content += `\nRESOURCES\n${'='.repeat(50)}\n\n`;
        moduleContent.resources.forEach((resource) => {
          content += `• ${resource.title} (${resource.type})\n`;
          content += `  ${resource.description}\n`;
          content += `  ${resource.url}\n\n`;
        });
      }

      if (moduleContent.youtubeVideos.length > 0) {
        content += `\nYOUTUBE VIDEOS\n${'='.repeat(50)}\n\n`;
        moduleContent.youtubeVideos.forEach((video) => {
          content += `• ${video.title}\n`;
          content += `  Channel: ${video.channel}\n`;
          content += `  Duration: ${video.duration}\n`;
          content += `  Link: https://www.youtube.com/watch?v=${video.videoId}\n\n`;
        });
      }

      if (moduleContent.webScrapedContent.length > 0) {
        content += `\nARTICLES & TUTORIALS\n${'='.repeat(50)}\n\n`;
        moduleContent.webScrapedContent.forEach((article) => {
          content += `• ${article.title}\n`;
          content += `  ${article.summary}\n`;
          content += `  ${article.url}\n\n`;
        });
      }

      navigator.clipboard.writeText(content);
      setCopied(true);
      
      toast({
        title: "Content Copied",
        description: "Module content has been copied to clipboard",
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Copy Failed",
        description: "Failed to copy content. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading module content...</div>
        </div>
      </div>
    );
  }

  if (!moduleContent) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="text-destructive text-center">
            <p className="font-medium">Module content not found</p>
          </div>
          <Button onClick={() => navigate("/learning-path")}>
            Back to Learning Path
          </Button>
        </div>
      </div>
    );
  }

  const selectedLessonData = moduleContent.lessons.find(l => l.id === selectedLesson);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Button
          variant="ghost"
          onClick={() => navigate("/learning-path")}
          className="mb-2"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Learning Path
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">{moduleContent.title}</h1>
            <p className="text-muted-foreground">{moduleContent.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {moduleContent.duration}
              </span>
              <Badge variant="secondary">{moduleContent.difficulty}</Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={copyToClipboard}
              className="gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Copy Notes
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={exportToPDF}
              className="gap-2"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </Button>
            
            <Link to={`/viva/${encodeURIComponent(moduleContent.title)}?moduleTitle=${encodeURIComponent(moduleContent.title)}`}>
              <Button size="lg" className="gap-2">
                <Award className="w-5 h-5" />
                Take Viva
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lessons Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {moduleContent.lessons.map((lesson, index) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    selectedLesson === lesson.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted border-border"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {lesson.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {index + 1}. {lesson.title}
                      </p>
                      <p className="text-xs opacity-70 mt-1">{lesson.duration}</p>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Lesson Content */}
          {selectedLessonData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedLessonData.title}</CardTitle>
                  <Badge>{selectedLessonData.type}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{selectedLessonData.content}</ReactMarkdown>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Mark as Complete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Resources Tabs */}
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="youtube" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="youtube">
                    <Youtube className="w-4 h-4 mr-2" />
                    Videos
                  </TabsTrigger>
                  <TabsTrigger value="resources">
                    <FileText className="w-4 h-4 mr-2" />
                    Resources
                  </TabsTrigger>
                </TabsList>

                {/* YouTube Videos */}
                <TabsContent value="youtube" className="space-y-4 mt-4">
                  {moduleContent.youtubeVideos.map((video) => (
                    <Card key={video.id} className="overflow-hidden">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative w-full sm:w-48 h-32 bg-muted flex-shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors cursor-pointer">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <h4 className="font-semibold text-sm mb-1">{video.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{video.channel}</p>
                          <p className="text-xs text-muted-foreground mb-3">{video.description}</p>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">{video.duration}</Badge>
                            <a
                              href={`https://www.youtube.com/watch?v=${video.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              Watch on YouTube
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                {/* Resources */}
                <TabsContent value="resources" className="space-y-3 mt-4">
                  {moduleContent.resources.map((resource) => (
                    <Card key={resource.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-4 h-4 text-primary" />
                              <h4 className="font-semibold text-sm">{resource.title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{resource.description}</p>
                            <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                          </div>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ModuleDetail;
