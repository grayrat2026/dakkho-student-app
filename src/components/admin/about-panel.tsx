'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Info, Target, Users, HelpCircle, Phone, Mail, MapPin,
  Plus, Trash2, Save, GripVertical, Edit3, X, Check,
  BookOpen, GraduationCap, Globe, Sparkles, Heart, AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '@/lib/api-client';

// ─── Icon map for team/stats ───
const ICON_OPTIONS = [
  { value: 'book-open', label: 'Book Open', Icon: BookOpen },
  { value: 'graduation-cap', label: 'Graduation Cap', Icon: GraduationCap },
  { value: 'globe', label: 'Globe', Icon: Globe },
  { value: 'sparkles', label: 'Sparkles', Icon: Sparkles },
  { value: 'heart', label: 'Heart', Icon: Heart },
  { value: 'users', label: 'Users', Icon: Users },
  { value: 'info', label: 'Info', Icon: Info },
  { value: 'target', label: 'Target', Icon: Target },
];

// ─── Animation ───
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// ─── Types ───
interface AboutContent {
  aboutText: string;
  missionText: string;
  contactEmail: string;
  contactPhone1: string;
  contactPhone2: string;
  contactAddress: string;
  missionValues: string[];
}

interface AboutStat {
  id: number;
  label: string;
  value: string;
  icon: string;
  sortOrder: number;
  isActive: number;
}

interface AboutTeamMember {
  id: number;
  name: string;
  role: string;
  avatarUrl?: string;
  icon: string;
  sortOrder: number;
  isActive: number;
}

interface AboutFaq {
  id: number;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: number;
}

// ─── Default Content ───
const DEFAULT_CONTENT: AboutContent = {
  aboutText: "DAKKHO is Bangladesh's premier online learning platform built exclusively for polytechnic students. We provide high-quality video courses aligned with the BTEB curriculum, covering all major technologies from Web Development and Electronics to Civil Engineering and Architecture. Our platform connects students with expert instructors from across the country, making quality technical education accessible regardless of location or financial background.",
  missionText: "To democratize technical education in Bangladesh by providing world-class learning experiences to every polytechnic student. We believe that geographical boundaries or financial constraints should never be barriers to quality education. Through technology, community, and dedicated instructors, we are building the future skilled workforce of Bangladesh.",
  contactEmail: 'support@dakkho.com.bd',
  contactPhone1: '+8809638113227',
  contactPhone2: '+8801632373707',
  contactAddress: 'Radhaballav Road near DPHE, Rangpur',
  missionValues: ['Accessible Education', 'Quality Content', 'Student First', 'Innovation'],
};

export default function AboutPanel() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [stats, setStats] = useState<AboutStat[]>([]);
  const [team, setTeam] = useState<AboutTeamMember[]>([]);
  const [faq, setFaq] = useState<AboutFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  // ─── Fetch all about data ───
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<{
        content: AboutContent;
        stats: AboutStat[];
        team: AboutTeamMember[];
        faq: AboutFaq[];
      }>('/about');
      setContent(data.content || DEFAULT_CONTENT);
      setStats(data.stats || []);
      setTeam(data.team || []);
      setFaq(data.faq || []);
    } catch {
      toast({ title: 'Error', description: 'Failed to load about data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Save content (about text, mission, contact) ───
  const handleSaveContent = async () => {
    setSaving(true);
    try {
      await apiPut('/about/content', content);
      toast({ title: 'Success', description: 'About content updated' });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Network error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  // ─── CRUD helpers for stats, team, faq ───
  const createItem = async (type: 'stats' | 'team' | 'faq', item: Record<string, unknown>) => {
    try {
      await apiPost(`/about/${type}`, item);
      await fetchData();
      toast({ title: 'Success', description: 'Item created' });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Network error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const updateItem = async (type: 'stats' | 'team' | 'faq', item: Record<string, unknown>) => {
    try {
      await apiPut(`/about/${type}`, item);
      await fetchData();
      toast({ title: 'Success', description: 'Item updated' });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Network error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  const deleteItem = async (type: 'stats' | 'team' | 'faq', id: number) => {
    try {
      await apiDelete(`/about/${type}?id=${id}`);
      await fetchData();
      toast({ title: 'Success', description: 'Item deleted' });
    } catch (error) {
      const msg = error instanceof ApiError ? error.message : 'Network error';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-xl bg-white/5 animate-shimmer" />)}
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemVariants} className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Info className="h-5 w-5 text-white" />
            </div>
            About Page Manager
          </h1>
          <p className="page-description">Manage the About page content visible to students — text, stats, team, FAQ, contact info</p>
        </div>
      </motion.div>

      <Tabs defaultValue="content" className="space-y-4">
        <TabsList className="bg-white/5 border border-white/10 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="content" className="data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue text-xs sm:text-sm">
            <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Content & Contact
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue text-xs sm:text-sm">
            <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Stats
          </TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue text-xs sm:text-sm">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> Team
          </TabsTrigger>
          <TabsTrigger value="faq" className="data-[state=active]:bg-dakkho-blue/20 data-[state=active]:text-dakkho-blue text-xs sm:text-sm">
            <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" /> FAQ
          </TabsTrigger>
        </TabsList>

        {/* ─── Content & Contact Tab ─── */}
        <TabsContent value="content">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-lg">About Text, Mission & Contact</CardTitle>
                <Button size="sm" onClick={handleSaveContent} disabled={saving} className="gradient-primary text-white w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* About Text */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">About DAKKHO Text</Label>
                <Textarea
                  value={content.aboutText}
                  onChange={(e) => setContent({ ...content, aboutText: e.target.value })}
                  rows={4}
                  className="bg-white/[0.04] border-white/[0.08] resize-none"
                  placeholder="Write about DAKKHO..."
                />
              </div>

              {/* Mission Text */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Our Mission</Label>
                <Textarea
                  value={content.missionText}
                  onChange={(e) => setContent({ ...content, missionText: e.target.value })}
                  rows={3}
                  className="bg-white/[0.04] border-white/[0.08] resize-none"
                  placeholder="Write your mission statement..."
                />
              </div>

              {/* Mission Values */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mission Values</Label>
                <div className="flex flex-wrap gap-2">
                  {content.missionValues.map((val, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dakkho-blue/10 text-dakkho-blue text-sm font-medium border border-dakkho-blue/20">
                      {val}
                      <button onClick={() => {
                        const newVals = [...content.missionValues];
                        newVals.splice(i, 1);
                        setContent({ ...content, missionValues: newVals });
                      }} className="hover:text-white transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <AddValueInput onAdd={(val) => setContent({ ...content, missionValues: [...content.missionValues, val] })} />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-base">Contact Information</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Support Email</Label>
                    <Input
                      value={content.contactEmail}
                      onChange={(e) => setContent({ ...content, contactEmail: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08]"
                      placeholder="support@dakkho.com.bd"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone 1</Label>
                    <Input
                      value={content.contactPhone1}
                      onChange={(e) => setContent({ ...content, contactPhone1: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08]"
                      placeholder="+8809638113227"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Phone 2</Label>
                    <Input
                      value={content.contactPhone2}
                      onChange={(e) => setContent({ ...content, contactPhone2: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08]"
                      placeholder="+8801632373707"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Address</Label>
                    <Input
                      value={content.contactAddress}
                      onChange={(e) => setContent({ ...content, contactAddress: e.target.value })}
                      className="bg-white/[0.04] border-white/[0.08]"
                      placeholder="Radhaballav Road near DPHE, Rangpur"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Stats Tab ─── */}
        <TabsContent value="stats">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-lg">Platform Stats</CardTitle>
                <Button size="sm" onClick={() => createItem('stats', { label: 'New Stat', value: '0', icon: 'book-open', sortOrder: stats.length + 1 })} className="gradient-primary text-white w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" /> Add Stat
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.map((stat) => (
                  <StatRow key={stat.id} stat={stat} editingId={editingId} setEditingId={setEditingId}
                    onUpdate={(item) => updateItem('stats', item)} onDelete={(id) => deleteItem('stats', id)} />
                ))}
                {stats.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No stats yet. Click "Add Stat" to create one.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Team Tab ─── */}
        <TabsContent value="team">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-lg">Team Members</CardTitle>
                <Button size="sm" onClick={() => createItem('team', { name: 'New Member', role: 'Role', icon: 'users', sortOrder: team.length + 1 })} className="gradient-primary text-white w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" /> Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {team.map((member) => (
                  <TeamRow key={member.id} member={member} editingId={editingId} setEditingId={setEditingId}
                    onUpdate={(item) => updateItem('team', item)} onDelete={(id) => deleteItem('team', id)} />
                ))}
                {team.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No team members yet. Click "Add Member" to create one.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── FAQ Tab ─── */}
        <TabsContent value="faq">
          <Card className="glass-card border-0 rounded-xl">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-lg">FAQ Items</CardTitle>
                <Button size="sm" onClick={() => createItem('faq', { question: 'New Question?', answer: 'Answer here...', sortOrder: faq.length + 1 })} className="gradient-primary text-white w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-1" /> Add FAQ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {faq.map((item) => (
                  <FaqRow key={item.id} faq={item} editingId={editingId} setEditingId={setEditingId}
                    onUpdate={(f) => updateItem('faq', f)} onDelete={(id) => deleteItem('faq', id)} />
                ))}
                {faq.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No FAQ items yet. Click "Add FAQ" to create one.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

// ─── Add Value Input Component ───
function AddValueInput({ onAdd }: { onAdd: (val: string) => void }) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);

  if (!show) {
    return (
      <button onClick={() => setShow(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.04] text-muted-foreground text-sm border border-dashed border-white/[0.12] hover:border-dakkho-blue/40 hover:text-dakkho-blue transition-colors">
        <Plus className="h-3 w-3" /> Add
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) { onAdd(value.trim()); setValue(''); setShow(false); }
          if (e.key === 'Escape') { setValue(''); setShow(false); }
        }}
        className="h-8 w-28 bg-white/[0.04] border-white/[0.08] text-sm"
        placeholder="Value..."
        autoFocus
      />
      <Button size="sm" variant="ghost" onClick={() => { if (value.trim()) { onAdd(value.trim()); setValue(''); } setShow(false); }} className="h-8 px-2">
        <Check className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => { setValue(''); setShow(false); }} className="h-8 px-2">
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ─── Delete Confirm Dialog ───
function DeleteConfirmDialog({ open, onConfirm, onCancel, itemName }: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">Delete Item?</h3>
            <p className="text-sm text-muted-foreground mt-0.5">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-white/80 mb-6">
          Are you sure you want to delete <span className="text-white font-medium">&quot;{itemName}&quot;</span>?
        </p>
        <div className="flex gap-3 justify-end">
          <Button size="sm" variant="ghost" onClick={onCancel} className="text-white/70 hover:text-white">
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} className="bg-red-500 hover:bg-red-600 text-white">
            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Stat Row Component (Mobile-Friendly) ───
function StatRow({ stat, editingId, setEditingId, onUpdate, onDelete }: {
  stat: AboutStat;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdate: (item: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}) {
  const isEditing = editingId === `stat-${stat.id}`;
  const [label, setLabel] = useState(stat.label);
  const [value, setValue] = useState(stat.value);
  const [icon, setIcon] = useState(stat.icon);
  const [sortOrder, setSortOrder] = useState(stat.sortOrder);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { setLabel(stat.label); setValue(stat.value); setIcon(stat.icon); setSortOrder(stat.sortOrder); }, [stat]);

  const handleSave = () => {
    onUpdate({ id: stat.id, label, value, icon, sortOrder, isActive: stat.isActive });
    setEditingId(null);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(stat.id);
  };

  return (
    <>
      <div className={`p-3 sm:p-4 rounded-lg transition-all ${isEditing ? 'bg-dakkho-blue/5 border border-dakkho-blue/20' : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'}`}>
        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-9 bg-white/[0.04] border-white/[0.08] w-full" placeholder="e.g. Instructors" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Value</Label>
                <Input value={value} onChange={(e) => setValue(e.target.value)} className="h-9 bg-white/[0.04] border-white/[0.08] w-full" placeholder="e.g. 50+" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Icon</Label>
                <select value={icon} onChange={(e) => setIcon(e.target.value)} className="h-9 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 text-sm w-full">
                  {ICON_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="h-9 bg-white/[0.04] border-white/[0.08] w-full" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-9 px-3">
                <X className="h-4 w-4 mr-1.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white">
                <Check className="h-4 w-4 mr-1.5" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab hidden sm:block" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold">{stat.label}</span>
                <span className="text-sm text-dakkho-blue font-bold">{stat.value}</span>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded">order: {stat.sortOrder}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch checked={!!stat.isActive} onCheckedChange={(v) => onUpdate({ id: stat.id, isActive: v })} className={stat.isActive ? '' : 'data-[state=unchecked]:bg-white/10'} />
              <Button size="sm" variant="ghost" onClick={() => setEditingId(`stat-${stat.id}`)} className="h-8 px-2">
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="h-8 px-2 text-red-400 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        itemName={stat.label}
      />
    </>
  );
}

// ─── Team Row Component (Mobile-Friendly) ───
function TeamRow({ member, editingId, setEditingId, onUpdate, onDelete }: {
  member: AboutTeamMember;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdate: (item: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}) {
  const isEditing = editingId === `team-${member.id}`;
  const [name, setName] = useState(member.name);
  const [role, setRole] = useState(member.role);
  const [icon, setIcon] = useState(member.icon);
  const [sortOrder, setSortOrder] = useState(member.sortOrder);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { setName(member.name); setRole(member.role); setIcon(member.icon); setSortOrder(member.sortOrder); }, [member]);

  const handleSave = () => {
    onUpdate({ id: member.id, name, role, icon, sortOrder, isActive: member.isActive });
    setEditingId(null);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(member.id);
  };

  return (
    <>
      <div className={`p-3 sm:p-4 rounded-lg transition-all ${isEditing ? 'bg-dakkho-blue/5 border border-dakkho-blue/20' : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'}`}>
        {isEditing ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 bg-white/[0.04] border-white/[0.08] w-full" placeholder="Member name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Input value={role} onChange={(e) => setRole(e.target.value)} className="h-9 bg-white/[0.04] border-white/[0.08] w-full" placeholder="e.g. Lead Instructor" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Icon</Label>
                <select value={icon} onChange={(e) => setIcon(e.target.value)} className="h-9 bg-white/[0.04] border border-white/[0.08] rounded-md px-3 text-sm w-full">
                  {ICON_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="h-9 bg-white/[0.04] border-white/[0.08] w-full" />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-9 px-3">
                <X className="h-4 w-4 mr-1.5" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white">
                <Check className="h-4 w-4 mr-1.5" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab hidden sm:block" />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                <Users className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold">{member.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{member.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Switch checked={!!member.isActive} onCheckedChange={(v) => onUpdate({ id: member.id, isActive: v })} className={member.isActive ? '' : 'data-[state=unchecked]:bg-white/10'} />
              <Button size="sm" variant="ghost" onClick={() => setEditingId(`team-${member.id}`)} className="h-8 px-2">
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="h-8 px-2 text-red-400 hover:text-red-300">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        itemName={member.name}
      />
    </>
  );
}

// ─── FAQ Row Component (Mobile-Friendly) ───
function FaqRow({ faq, editingId, setEditingId, onUpdate, onDelete }: {
  faq: AboutFaq;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onUpdate: (item: Record<string, unknown>) => void;
  onDelete: (id: number) => void;
}) {
  const isEditing = editingId === `faq-${faq.id}`;
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [sortOrder, setSortOrder] = useState(faq.sortOrder);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => { setQuestion(faq.question); setAnswer(faq.answer); setSortOrder(faq.sortOrder); }, [faq]);

  const handleSave = () => {
    onUpdate({ id: faq.id, question, answer, sortOrder, isActive: faq.isActive });
    setEditingId(null);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(faq.id);
  };

  return (
    <>
      <div className={`p-3 sm:p-4 rounded-lg transition-all ${isEditing ? 'bg-dakkho-blue/5 border border-dakkho-blue/20' : 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'}`}>
        {isEditing ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Question</Label>
              <Input value={question} onChange={(e) => setQuestion(e.target.value)} className="h-9 bg-white/[0.04] border-white/[0.08] w-full" placeholder="Enter question" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Answer</Label>
              <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} className="bg-white/[0.04] border-white/[0.08] resize-none w-full" placeholder="Enter answer" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-[1fr_auto] gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="h-9 bg-white/[0.04] border-white/[0.08] w-full" />
              </div>
              <div className="flex items-end gap-2 pb-0">
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-9 px-3">
                  <X className="h-4 w-4 mr-1.5" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} className="h-9 px-3 bg-green-600 hover:bg-green-700 text-white">
                  <Check className="h-4 w-4 mr-1.5" /> Save
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{faq.question}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{faq.answer}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={!!faq.isActive} onCheckedChange={(v) => onUpdate({ id: faq.id, isActive: v })} className={faq.isActive ? '' : 'data-[state=unchecked]:bg-white/10'} />
                <Button size="sm" variant="ghost" onClick={() => setEditingId(`faq-${faq.id}`)} className="h-8 px-2">
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="h-8 px-2 text-red-400 hover:text-red-300">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        itemName={faq.question}
      />
    </>
  );
}
