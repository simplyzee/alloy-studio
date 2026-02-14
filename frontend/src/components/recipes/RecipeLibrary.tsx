import { useState, useEffect } from 'react';
import { BookOpen, Download, Copy, Code, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import type { Recipe } from '@/lib/types';

export function RecipeLibrary() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const { setConfig, setRecipe, setMode } = useAppStore();

  useEffect(() => {
    loadRecipes();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [search, selectedCategory, recipes]);

  const loadRecipes = async () => {
    try {
      const data = await api.getRecipes();
      setRecipes(data);
      setFilteredRecipes(data);
    } catch (error) {
      console.error('Failed to load recipes:', error);
    }
  };

  const filterRecipes = () => {
    let filtered = recipes;

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase()) ||
          r.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    setFilteredRecipes(filtered);
  };

  const categories = Array.from(new Set(recipes.map((r) => r.category)));

  const handleUseRecipe = (recipe: Recipe) => {
    setConfig(recipe.configuration);
    setRecipe(recipe);
    setSelectedRecipe(recipe);
  };

  const handleLoadInEditor = (recipe: Recipe) => {
    setConfig(recipe.configuration);
    setRecipe(recipe);
    setMode('editor');
  };

  const handleCopyRecipe = (recipe: Recipe) => {
    navigator.clipboard.writeText(recipe.configuration);
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      beginner: 'bg-green-500',
      intermediate: 'bg-yellow-500',
      advanced: 'bg-red-500',
    };
    return colors[difficulty] || 'bg-gray-500';
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Recipe Library</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Pre-built configurations for common observability patterns ({recipes.length} recipes)
        </p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedCategory === '' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSelectedCategory('')}
          >
            All ({recipes.length})
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory(category)}
            >
              {category} ({recipes.filter(r => r.category === category).length})
            </Badge>
          ))}
        </div>
      </div>

      {/* Grid of Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRecipes.map((recipe) => (
          <Card
            key={recipe.id}
            className={`hover:shadow-md transition-all ${
              selectedRecipe?.id === recipe.id ? 'ring-2 ring-primary' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold mb-2">
                {recipe.title}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {recipe.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {recipe.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className={`h-2 w-2 rounded-full ${getDifficultyColor(recipe.difficulty)}`} />
                  <span className="text-muted-foreground capitalize">
                    {recipe.difficulty}
                  </span>
                </div>
                <div className="flex gap-1">
                  {recipe.signals.map((signal) => (
                    <Badge key={signal} variant="outline" className="text-xs">
                      {signal}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => handleUseRecipe(recipe)}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Use Recipe
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleLoadInEditor(recipe)}
                  className="flex-1"
                >
                  <Code className="h-3 w-3 mr-1" />
                  Load in Editor
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyRecipe(recipe)}
                  title="Copy to clipboard"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No recipes found matching your search</p>
        </div>
      )}
    </div>
  );
}
