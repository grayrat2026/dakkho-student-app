'use client';

import { useState, useEffect } from 'react';
import { adminTermsApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface TermsDoc {
  id: string;
  type: string;
  title: string;
  content: string;
  title_bn?: string;
  content_bn?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function LegalPanel() {
  const [docs, setDocs] = useState<TermsDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<TermsDoc | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formType, setFormType] = useState('terms');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTitleBn, setFormTitleBn] = useState('');
  const [formContentBn, setFormContentBn] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const data = await adminTermsApi.listTerms();
      setDocs((data as Record<string, unknown>).terms as TermsDoc[] || (data as TermsDoc[]) || []);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load legal documents' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormType('terms');
    setFormTitle('');
    setFormContent('');
    setFormTitleBn('');
    setFormContentBn('');
    setFormIsActive(true);
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (doc: TermsDoc) => {
    setEditing(doc);
    setFormType(doc.type);
    setFormTitle(doc.title);
    setFormContent(doc.content);
    setFormTitleBn(doc.title_bn || '');
    setFormContentBn(doc.content_bn || '');
    setFormIsActive(doc.is_active === 1);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle || !formContent) {
      setMessage({ type: 'error', text: 'Title and content are required' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      if (editing) {
        const data = await adminTermsApi.updateTerms(editing.id, {
          title: formTitle,
          content: formContent,
          title_bn: formTitleBn || undefined,
          content_bn: formContentBn || undefined,
          is_active: formIsActive ? 1 : 0,
        });
        if ((data as Record<string, unknown>).success) {
          setMessage({ type: 'success', text: 'Document updated successfully' });
          resetForm();
          loadDocs();
        } else {
          setMessage({ type: 'error', text: ((data as Record<string, unknown>).error as string) || 'Update failed' });
        }
      } else {
        const data = await adminTermsApi.createTerms({
          type: formType,
          title: formTitle,
          content: formContent,
          title_bn: formTitleBn || undefined,
          content_bn: formContentBn || undefined,
          is_active: formIsActive ? 1 : 0,
        });
        if ((data as Record<string, unknown>).success) {
          setMessage({ type: 'success', text: 'Document created successfully' });
          resetForm();
          loadDocs();
        } else {
          setMessage({ type: 'error', text: ((data as Record<string, unknown>).error as string) || 'Creation failed' });
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Operation failed' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const data = await adminTermsApi.deleteTerms(id);
      if ((data as Record<string, unknown>).success) {
        setMessage({ type: 'success', text: 'Document deleted' });
        loadDocs();
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete document' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-dakkho-blue" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Legal Pages</h2>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gradient-primary text-white">
          <Plus className="h-4 w-4 mr-2" /> New Document
        </Button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
        </div>
      )}

      {showForm && (
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-white">{editing ? 'Edit Document' : 'New Document'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Type</Label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 rounded-md bg-white/5 border border-white/10 text-white text-sm"
                >
                  <option value="terms">Terms of Service</option>
                  <option value="privacy">Privacy Policy</option>
                  <option value="refund">Refund Policy</option>
                  <option value="cookie">Cookie Policy</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Title (English)</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder="Document title" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Content (English)</Label>
              <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[200px]" placeholder="Document content in English" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Title (Bengali)</Label>
                <Input value={formTitleBn} onChange={(e) => setFormTitleBn(e.target.value)} className="bg-white/5 border-white/10 text-white" placeholder=" Bengali title" />
              </div>
              <div className="space-y-2 flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} className="rounded" />
                  Active
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Content (Bengali)</Label>
              <Textarea value={formContentBn} onChange={(e) => setFormContentBn(e.target.value)} className="bg-white/5 border-white/10 text-white min-h-[150px]" placeholder="Document content in Bengali" />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="gradient-primary text-white">
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editing ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={resetForm} className="border-white/10 text-muted-foreground">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {docs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No legal documents yet</p>
            <p className="text-sm">Create your first document to get started</p>
          </div>
        ) : (
          docs.map((doc) => (
            <Card key={doc.id} className="bg-white/[0.03] border-white/[0.06]">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-dakkho-blue flex-shrink-0" />
                    <h3 className="text-white font-medium truncate">{doc.title}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">{doc.type}</span>
                    {doc.is_active === 1 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{doc.content.substring(0, 120)}...</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(doc)} className="text-muted-foreground hover:text-white">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </motion.div>
  );
}
