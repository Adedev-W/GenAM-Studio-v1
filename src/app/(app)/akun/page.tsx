"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Save, User, Bell, CheckCircle, AlertCircle, Loader2,
  Shield, Trash2, KeyRound, Mail,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";

interface Profile {
  id: string;
  display_name: string | null;
  email: string;
  role: string;
  avatar_url: string | null;
}

export default function AkunPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile
  const [displayName, setDisplayName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Reset password via email
  const [sendingReset, setSendingReset] = useState(false);
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/profile')
      .then(r => r.json())
      .then(p => {
        setProfile(p);
        setDisplayName(p.display_name || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setProfileMsg({ type: 'success', text: 'Profil tersimpan.' });
    } catch (e: any) {
      setProfileMsg({ type: 'error', text: e.message });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok.' });
      return;
    }

    setChangingPassword(true);
    try {
      const supabase = createClient();

      // Verify current password by re-signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile?.email || '',
        password: currentPassword,
      });
      if (signInError) {
        setPasswordMsg({ type: 'error', text: 'Kata sandi saat ini salah.' });
        setChangingPassword(false);
        return;
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setPasswordMsg({ type: 'error', text: updateError.message });
      } else {
        setPasswordMsg({ type: 'success', text: 'Kata sandi berhasil diubah.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (e: any) {
      setPasswordMsg({ type: 'error', text: e.message });
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSendResetEmail() {
    setSendingReset(true);
    setResetMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(profile?.email || '', {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        setResetMsg({ type: 'error', text: error.message });
      } else {
        setResetMsg({ type: 'success', text: `Link reset telah dikirim ke ${profile?.email}. Cek inbox atau folder spam.` });
      }
    } catch (e: any) {
      setResetMsg({ type: 'error', text: e.message });
    } finally {
      setSendingReset(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmation !== 'HAPUS AKUN SAYA') {
      setDeleteError('Ketik "HAPUS AKUN SAYA" untuk melanjutkan.');
      return;
    }

    setDeletingAccount(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      // Sign out and redirect
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (e: any) {
      setDeleteError(e.message);
      setDeletingAccount(false);
    }
  }

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : (profile?.email?.[0] ?? 'U').toUpperCase();

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Akun Saya" description="Kelola profil dan preferensi akun kamu" />
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Akun Saya" description="Kelola profil dan preferensi akun kamu" />

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4" /> Profil</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-2 h-4 w-4" /> Keamanan</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-2 h-4 w-4" /> Notifikasi</TabsTrigger>
        </TabsList>

        {/* ── Tab: Profil ── */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Informasi Profil</CardTitle>
              <CardDescription className="font-light">Data pribadi akun kamu</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg font-medium">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{profile?.display_name || 'Belum diatur'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  <Badge variant="outline" className="mt-1 text-xs capitalize">{profile?.role}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Nama</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Email</Label>
                  <Input value={profile?.email || ''} type="email" disabled className="opacity-60" />
                </div>
              </div>
              {profileMsg && (
                <StatusMessage type={profileMsg.type} text={profileMsg.text} />
              )}
              <div className="flex justify-end">
                <Button variant="ghost" className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary" onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Keamanan ── */}
        <TabsContent value="security" className="space-y-4">
          {/* Change Password */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Ubah Kata Sandi
              </CardTitle>
              <CardDescription className="font-light">
                Ubah kata sandi akun kamu secara langsung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 max-w-md">
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Kata Sandi Saat Ini</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Kata Sandi Baru</Label>
                  <Input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-medium text-sm">Konfirmasi Kata Sandi Baru</Label>
                  <Input
                    type="password"
                    placeholder="Ketik ulang kata sandi baru"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              {passwordMsg && (
                <StatusMessage type={passwordMsg.type} text={passwordMsg.text} />
              )}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
                  onClick={handleChangePassword}
                  disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                >
                  {changingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                  Ubah Kata Sandi
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reset via Email */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4" /> Lupa Kata Sandi
              </CardTitle>
              <CardDescription className="font-light">
                Kirim link reset kata sandi ke email kamu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground font-light">
                Link reset akan dikirim ke <span className="font-medium text-foreground">{profile?.email}</span>.
                Gunakan link tersebut untuk membuat kata sandi baru.
              </p>
              {resetMsg && (
                <StatusMessage type={resetMsg.type} text={resetMsg.text} />
              )}
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  className="bg-primary/5 text-primary/70 hover:bg-primary/15 hover:text-primary"
                  onClick={handleSendResetEmail}
                  disabled={sendingReset}
                >
                  {sendingReset ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                  Kirim Link Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone: Delete Account */}
          <Card className="border-destructive/30 bg-destructive/[0.02]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-destructive flex items-center gap-2">
                <Trash2 className="h-4 w-4" /> Zona Bahaya
              </CardTitle>
              <CardDescription className="font-light">
                Tindakan ini tidak dapat dibatalkan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground font-light">
                Menghapus akun akan menghapus <span className="font-medium text-foreground">seluruh data</span> kamu secara permanen,
                termasuk semua bisnis yang hanya kamu miliki beserta agen, pesanan, produk, alur kerja, dan data terkait lainnya.
              </p>
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setShowDeleteDialog(true);
                    setDeleteConfirmation('');
                    setDeleteError(null);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Akun
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Notifikasi ── */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Preferensi Notifikasi</CardTitle>
              <CardDescription className="font-light">Pilih notifikasi yang ingin kamu terima</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Peringatan", desc: "Notifikasi saat peringatan terpicu" },
                { label: "Error agen", desc: "Notifikasi saat agen mengalami error" },
                { label: "Peringatan anggaran", desc: "Notifikasi saat pengeluaran mendekati batas" },
                { label: "Aktivitas tim", desc: "Notifikasi tentang aktivitas anggota tim" },
              ].map(n => (
                <div key={n.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{n.label}</p>
                    <p className="text-xs text-muted-foreground font-light">{n.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Hapus Akun Permanen
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left">
              <span className="block">
                Semua data berikut akan dihapus secara <span className="font-semibold text-foreground">permanen</span>:
              </span>
              <span className="block text-sm space-y-1">
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" /> Profil dan data akun</span>
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" /> Bisnis yang hanya kamu miliki</span>
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" /> Agen, produk, pesanan, pelanggan</span>
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" /> Alur kerja, integrasi, dan konfigurasi</span>
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-destructive inline-block" /> Semua riwayat percakapan</span>
              </span>
              <span className="block pt-2">
                Ketik <span className="font-mono font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">HAPUS AKUN SAYA</span> untuk mengonfirmasi:
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1">
            <Input
              value={deleteConfirmation}
              onChange={e => setDeleteConfirmation(e.target.value)}
              placeholder="Ketik di sini..."
              className={deleteConfirmation === 'HAPUS AKUN SAYA' ? 'border-destructive focus-visible:ring-destructive' : ''}
              autoComplete="off"
            />
            {deleteError && (
              <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                {deleteError}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount}>Batal</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirmation !== 'HAPUS AKUN SAYA'}
            >
              {deletingAccount ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {deletingAccount ? 'Menghapus...' : 'Hapus Akun Permanen'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatusMessage({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${type === 'success' ? 'text-emerald-500' : 'text-destructive'}`}>
      {type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
      {text}
    </div>
  );
}
