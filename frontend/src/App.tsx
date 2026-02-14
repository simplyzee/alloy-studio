import { useState } from 'react';
import { Code, Blocks, BookOpen, Coffee, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MonacoEditor } from '@/components/editor/MonacoEditor';
import { Toolbar } from '@/components/editor/Toolbar';
import { ComponentPicker } from '@/components/builder/ComponentPicker';
import { RecipeLibrary } from '@/components/recipes/RecipeLibrary';
import { LivePreview } from '@/components/builder/LivePreview';
import { ComponentReference } from '@/components/editor/ComponentReference';
import { Button } from '@/components/ui/button';
import { ComingSoonDialog } from '@/components/ui/ComingSoonDialog';

type TabType = 'components' | 'recipes';

function App() {
  const { mode, setMode } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('components');
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path fill="#ff6f00" d="M20.173 8.483a14.7 14.7 0 0 0-3.287-3.92l-.025-.02a13 13 0 0 0-.784-.603C14.28 2.67 12.317 2 10.394 2C7.953 2 5.741 3.302 4.167 5.668C1.952 8.994 1.48 13.656 2.99 17.269c1.134 2.712 4.077 4.47 7.873 4.706q.415.024.833.025c1.757 0 3.531-.338 5.073-.975c1.962-.81 3.463-2.048 4.342-3.583c1.304-2.28.945-5.712-.938-8.96zm-8.871.508c.863 0 1.723.354 2.341 1.048c.558.625.839 1.43.79 2.266a3.1 3.1 0 0 1-1.007 2.128l-.072.064a3.14 3.14 0 0 1-3.725.28a4.4 4.4 0 0 1-.745-.67a3 3 0 0 1-.17-.214a3.1 3.1 0 0 1-.416-.874l-.016-.057l-.002-.007c-.277-1.08.04-2.339.905-3.138l.066-.061a3.12 3.12 0 0 1 2.05-.764zm-.908-5.84c1.683 0 3.418.598 5.018 1.73q.367.26.72.553l.386.348c2.95 2.744 3.873 5.42 3.642 8.189c-.151 1.818-1.31 3.27-2.97 4.394c-1.58 1.07-4 1.377-5.727 1.192c-1.697-.182-3.456-.866-4.592-2.404c-.939-1.273-1.218-2.64-1.091-4.107c.127-1.459.712-2.823 1.662-3.772c.533-.533 1.442-1.202 2.894-1.324c-.68.156-1.33.48-1.887.976a4.29 4.29 0 0 0-1.378 3.869c.093.636.33 1.248.713 1.778a4.3 4.3 0 0 0 1.252 1.191c1.66 1.121 3.728 1.033 5.747-.306c1.1-.73 1.844-1.994 2.04-3.471c.238-1.788-.336-3.623-1.575-5.033c-1.347-1.533-3.212-2.44-5.116-2.49c-1.77-.046-3.409.652-4.737 2.017c-.407.417-.777.87-1.107 1.349q.358-.801.838-1.523C6.48 4.272 8.35 3.152 10.394 3.152z"/>
            </svg>
            <div>
              <h1 className="text-2xl font-bold">Alloy Studio</h1>
              <p className="text-sm text-muted-foreground">
                Build and validate Grafana Alloy configurations
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={mode === 'builder' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('builder')}
            >
              <Blocks className="h-4 w-4 mr-2" />
              Builder
            </Button>
            <Button
              variant={mode === 'editor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('editor')}
            >
              <Code className="h-4 w-4 mr-2" />
              Editor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setComingSoonOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Coming Soon
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a
                href="https://buymeacoffee.com/simplyzee"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <Coffee className="h-4 w-4 mr-2" />
                Buy me a coffee
              </a>
            </Button>
          </div>
        </div>
      </header>

      <ComingSoonDialog open={comingSoonOpen} onOpenChange={setComingSoonOpen} />

      {mode === 'editor' && <Toolbar />}

      <main className="flex flex-1 overflow-hidden">
        {mode === 'editor' && (
          <div className="flex flex-1">
            {/* Component Reference Sidebar */}
            <aside className="w-[350px] border-r border-border flex-shrink-0">
              <ComponentReference />
            </aside>

            {/* Monaco Editor */}
            <div className="flex-1">
              <MonacoEditor />
            </div>
          </div>
        )}

        {mode === 'builder' && (
          <div className="flex flex-1">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-border bg-card px-4">
                <button
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'components'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('components')}
                >
                  <Blocks className="h-4 w-4 inline mr-2" />
                  Components
                </button>
                <button
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    activeTab === 'recipes'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setActiveTab('recipes')}
                >
                  <BookOpen className="h-4 w-4 inline mr-2" />
                  Recipes
                </button>
              </div>

              {/* Grid Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'components' && <ComponentPicker />}
                {activeTab === 'recipes' && <RecipeLibrary />}
              </div>
            </div>

            {/* Right Panel - Live Preview */}
            <aside className="w-[500px] border-l border-border bg-card flex-shrink-0">
              <LivePreview />
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
