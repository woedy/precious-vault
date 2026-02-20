import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/context/AuthContext';
import { useVaults } from '@/hooks/useVaults';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building2,
  Shield,
  Bell,
  LogOut,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user, logout, checkAuth } = useAuth();
  const { data: vaults, isLoading: vaultsLoading } = useVaults();
  const { updateProfile, toggle2FA } = useSettings();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [preferredVault, setPreferredVault] = useState(user?.preferredVault || '');
  const [twoFactor, setTwoFactor] = useState(user?.twoFactorEnabled || false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state when user object becomes available
  useEffect(() => {
    if (user && !isInitialized) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phoneNumber || '');
      setPreferredVault(user.preferredVault || '');
      setTwoFactor(user.twoFactorEnabled);
      setIsInitialized(true);
    }
  }, [user, isInitialized]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone,
        preferred_vault: preferredVault || undefined
      });
      await checkAuth(); // Refresh profile in context
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    try {
      await toggle2FA.mutateAsync(enabled);
      setTwoFactor(enabled);
      await checkAuth();
    } catch (error) {
      console.error("2FA toggle failed", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        {/* Profile Section */}
        <div className="card-premium mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input id="email" value={user.email} disabled className="mt-2 pl-10 opacity-70" />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 mt-1 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 pl-10" />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 mt-1 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div>
              <Label>Member Since</Label>
              <div className="relative">
                <Input value="Feb 2026" disabled className="mt-2 pl-10 opacity-70" />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 mt-1 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Vault Preferences */}
        <div className="card-premium mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Vault Preferences
          </h2>

          <div>
            <Label>Preferred Storage Location</Label>
            <Select value={preferredVault} onValueChange={setPreferredVault}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select a vault" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(vaults) && vaults.map((vault) => (
                  <SelectItem key={vault.id} value={vault.id}>
                    <span className="flex items-center gap-2">
                      <span>{vault.flag_emoji || '🌐'}</span>
                      <span>{vault.city}, {vault.country}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              New purchases will be stored in this vault by default.
            </p>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card-premium mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Security
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch checked={twoFactor} onCheckedChange={handleToggle2FA} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your transactions and account
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="gold" size="lg" className="flex-1" onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
            Save Changes
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Log Out
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Settings changes are saved to your profile.
        </p>
      </div>
    </Layout>
  );
}
