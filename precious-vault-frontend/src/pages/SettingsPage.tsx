import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { user, vaults } from '@/data/mockData';
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
  LogOut
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
  const [twoFactor, setTwoFactor] = useState(user.twoFactor);
  const [notifications, setNotifications] = useState(user.notifications);
  const [preferredVault, setPreferredVault] = useState(user.preferredVault);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleLogout = () => {
    navigate('/');
  };

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
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user.name} className="mt-2" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Input id="email" defaultValue={user.email} className="mt-2 pl-10" />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 mt-1 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Input id="phone" defaultValue={user.phone} className="mt-2 pl-10" />
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 mt-1 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <div>
                <Label>Member Since</Label>
                <div className="relative">
                  <Input value={user.joinDate} disabled className="mt-2 pl-10" />
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 mt-1 h-4 w-4 text-muted-foreground" />
                </div>
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vaults.map((vault) => (
                  <SelectItem key={vault.id} value={vault.city}>
                    <span className="flex items-center gap-2">
                      <span>{vault.flag}</span>
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
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive updates about your transactions and account
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="gold" size="lg" className="flex-1" onClick={handleSave}>
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
          Settings changes are saved automatically.
        </p>
      </div>
    </Layout>
  );
}
