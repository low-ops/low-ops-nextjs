"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { createUser } from "@/utils/auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Switch } from "@/components/ui/switch";

interface UserAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UserAddDialog({
  isOpen,
  onClose,
  onSuccess,
}: UserAddDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
    autoVerify: false,
  });

  const handleCreateUser = async () => {
    try {
      setIsLoading(true);
      await createUser(formData);
      toast.success(
        formData.autoVerify
          ? "User created and verified successfully"
          : "User created successfully. Verification email sent.",
      );
      onSuccess?.();
      onClose();
      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "user",
        autoVerify: false,
      });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfirmationDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleCreateUser}
      title="Add New User"
      description="Create a new user account with the following details."
      confirmText={isLoading ? "Creating..." : "Create User"}
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="add-user-name">Name</Label>
          <Input
            id="add-user-name"
            name="add-user-name"
            autoComplete="off"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter user's name"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="add-user-email">Email</Label>
          <Input
            id="add-user-email"
            name="add-user-email"
            type="email"
            autoComplete="off"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter user's email"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="add-user-password">Password</Label>
          <Input
            id="add-user-password"
            name="add-user-password"
            type="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Enter user's password"
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="add-user-role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value: "user" | "admin") =>
              setFormData((prev) => ({ ...prev, role: value }))
            }
          >
            <SelectTrigger id="add-user-role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="add-user-auto-verify" className="cursor-pointer">
            Auto-verify email
          </Label>
          <Switch
            id="add-user-auto-verify"
            checked={formData.autoVerify}
            onCheckedChange={(checked: boolean) =>
              setFormData((prev) => ({ ...prev, autoVerify: checked }))
            }
          />
        </div>
      </div>
    </ConfirmationDialog>
  );
}
