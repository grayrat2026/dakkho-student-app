'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Globe, Smartphone, Cpu, Zap, Wrench, Building2, Ruler, Code, BarChart3, Wifi, Palette, Scissors } from 'lucide-react';
import { useNavigationStore } from '@/lib/store';
import { type Category, type Course, type Technology, categoryApi, courseApi, technologyApi } from '@/lib/api-client';
import { CourseCardGrid } from '../shared/CourseCardGrid';
import { GradientButton } from '../shared/GradientButton';
import { GlassCard } from '../shared/GlassCard';
import { LoadingSkeleton } from '../shared/LoadingSkeleton';

const iconMap: Record<string, React.ElementType> = {
  Globe, Smartphone, Cpu, Zap, Wrench, Building2, Ruler, Code, BarChart3, Wifi, Palette, Scissors,
};

// Map technology short_codes to icon names
const techIconMap: Record<string, string> = {
  'cse': 'Monitor',
  'ete': 'Cpu',
  'eee': 'Zap',
  'me': 'Wrench',
  'ce': 'Building2',
  'architecture': 'Ruler',
  'textile': 'Scissors',
  'chemical': 'Code',
  'automobile': 'Zap',
  'rac': 'Wifi',
  'glass-ceramic': 'Palette',
  'printing': 'Smartphone',
  'surveying': 'Globe',
  'mechatronics': 'Cpu',
  'mining': 'BarChart3',
  'metallurgical': 'Wrench',
  'power': 'Zap',
  'instrumentation': 'BarChart3',
  'food': 'Smartphone',
  'leather': 'Scissors',
};

const techColorMap: Record<string, string> = {
  'cse': '#0ea5e9',
  'ete': '#8b5cf6',
  'eee': '#f59e0b',
  'me': '#64748b',
  'ce': '#10b981',
  'architecture': '#ec4899',
  'textile': '#06b6d4',
  'chemical': '#f97316',
  'automobile': '#ef4444',
  'rac': '#38bdf8',
  'glass-ceramic': '#a855f7',
  'printing': '#14b8a6',
  'surveying': '#84cc16',
  'mechatronics': '#e879f9',
  'mining': '#78716c',
  'metallurgical': '#fb923c',
  'power': '#facc15',
  'instrumentation': '#2dd4bf',
  'food': '#4ade80',
  'leather': '#a16207',
};

export function CategoryPage() {
  const { pageParams, goBack, navigate } = useNavigationStore();
  const categoryId = pageParams.categoryId as string;

  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      technologyApi.list(),
      categoryApi.list(),
    ])
      .then(([techRes, catRes]) => {
        setTechnologies(techRes.technologies);
        setCategories(catRes.categories);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // If viewing a specific category, fetch its courses
  useEffect(() => {
    if (categoryId) {
      setLoading(true);
      courseApi.list({ technology: categoryId, limit: 50 })
        .then((res) => setCourses(res.courses))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [categoryId]);

  // Find the category or technology for the current ID
  const currentCategory = categoryId
    ? categories.find((c) => c.id === categoryId) || categories.find((c) => c.slug === categoryId)
    : undefined;

  // Build display items from technologies (as categories) + any API categories
  const displayCategories = categories.length > 0
    ? categories
    : technologies.map((t, idx) => ({
        id: t.short_code || String(t.id),
        name: t.name,
        slug: t.short_code || String(t.id),
        icon: techIconMap[t.short_code] || 'Globe',
        color: techColorMap[t.short_code] || ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ec4899'][idx % 5],
        courseCount: 0,
      }));

  // If no specific category, show all categories grid
  if (!categoryId) {
    return (
      <div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-extrabold text-foreground mb-2">Categories</h1>
          <p className="text-sm text-muted-foreground mb-6">Browse courses by category</p>
        </motion.div>

        {loading ? (
          <LoadingSkeleton type="card" count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayCategories.map((cat, i) => {
              const Icon = iconMap[cat.icon] || Globe;
              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <GlassCard
                    hover
                    className="p-4 cursor-pointer text-center"
                    onClick={() => navigate('category', { categoryId: cat.id })}
                  >
                    <motion.div
                      className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
                      style={{ backgroundColor: cat.color + '15' }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <Icon className="w-6 h-6" style={{ color: cat.color }} />
                    </motion.div>
                    <h3 className="font-bold text-sm text-foreground mb-1">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">{cat.courseCount} courses</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Show specific category with its courses
  if (loading) {
    return (
      <div>
        <LoadingSkeleton type="card" count={4} />
      </div>
    );
  }

  if (!currentCategory && displayCategories.length === 0) {
    return (
      <div>
        <motion.button
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          onClick={goBack}
          whileHover={{ x: -3 }}
        >
          <ChevronLeft className="w-4 h-4" />
          Go Back
        </motion.button>
        <div className="text-center py-16">
          <p className="text-lg font-bold">Category not found</p>
          <GradientButton onClick={() => navigate('category')} className="mt-4">Browse All Categories</GradientButton>
        </div>
      </div>
    );
  }

  const displayCat = currentCategory || displayCategories.find((c) => c.id === categoryId);
  const Icon = iconMap[displayCat?.icon || ''] || Globe;

  return (
    <div>
      <motion.button
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        onClick={() => navigate('category')}
        whileHover={{ x: -3 }}
      >
        <ChevronLeft className="w-4 h-4" />
        All Categories
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: (displayCat?.color || '#0ea5e9') + '15' }}
          >
            <Icon className="w-5 h-5" style={{ color: displayCat?.color || '#0ea5e9' }} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{displayCat?.name || 'Category'}</h1>
            <p className="text-sm text-muted-foreground">
              {courses.length} course{courses.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
      </motion.div>

      {courses.length > 0 ? (
        <CourseCardGrid courses={courses} />
      ) : (
        <div className="text-center py-16">
          <p className="text-sm text-muted-foreground">No courses in this category yet</p>
          <GradientButton onClick={() => navigate('explore')} className="mt-4">Explore All Courses</GradientButton>
        </div>
      )}
    </div>
  );
}
