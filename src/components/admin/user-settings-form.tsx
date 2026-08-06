"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormError, FormSuccess } from "@/components/ui/form-messages";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Calendar,
  Camera,
  CheckCircle,
  Mail,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export type SettingsUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  role?: string | null;
  banned?: boolean | null;
  createdAt: Date;
};

type UserSettingsFormProps = {
  user: SettingsUser;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
        <span>{label}</span>
      </div>
      <div className="text-right text-sm font-medium">{value}</div>
    </div>
  );
}

async function uploadAvatarFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/user/avatar", {
    method: "POST",
    body: formData,
  });

  const data = (await response.json()) as { url?: string; error?: string };

  if (!response.ok) {
    throw new Error(data.error || "Failed to upload image");
  }

  if (!data.url) {
    throw new Error("Failed to upload image");
  }

  return data.url;
}

export function UserSettingsForm({ user }: UserSettingsFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formState, setFormState] = useState<{
    success?: string;
    error?: string;
  }>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.image ?? null,
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
    },
  });

  useEffect(() => {
    return () => {
      if (avatarFile && avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarFile, avatarPreview]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller");
      event.target.value = "";
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setFormState({});
  };

  const hasChanges = isDirty || avatarFile !== null;

  const onSubmit = async (data: ProfileFormData) => {
    setFormState({});

    try {
      let imageUrl = user.image ?? null;

      if (avatarFile) {
        imageUrl = await uploadAvatarFile(avatarFile);
      }

      const result = await authClient.updateUser({
        name: data.name,
        image: imageUrl,
      });

      if (result.error) {
        const message = result.error.message || "Failed to update profile.";
        setFormState({ error: message });
        toast.error(message);
        return;
      }

      setAvatarFile(null);
      if (avatarPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      setAvatarPreview(imageUrl);

      setFormState({ success: "Profile updated successfully." });
      toast.success("Profile updated successfully.");
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile.";
      setFormState({ error: message });
      toast.error(message);
    }
  };

  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and review account details.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Update your display name and profile photo.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 mb-6">
              <FormSuccess message={formState.success || ""} />
              <FormError message={formState.error || ""} />

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={avatarPreview ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback>
                      {getInitials(watch("name") || user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="absolute -right-1 -bottom-1 h-7 w-7 rounded-full shadow-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span className="sr-only">Change profile photo</span>
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <p className="font-medium">{watch("name") || user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      Upload photo
                    </Button>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      JPEG, PNG, WebP, or GIF. Max 5 MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                ) : null}
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isSubmitting || !hasChanges}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Important details about your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <ReadOnlyField label="Email" value={user.email} icon={Mail} />
              <ReadOnlyField
                label="Verification"
                value={
                  user.emailVerified ? (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 dark:border-green-700 dark:bg-green-900 dark:text-green-200"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 border-yellow-200 bg-yellow-50 px-2 py-1 text-xs text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-200"
                    >
                      <XCircle className="h-3 w-3" />
                      Unverified
                    </Badge>
                  )
                }
              />
              <ReadOnlyField
                label="Role"
                value={
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                  >
                    <Shield className="h-3 w-3" />
                    {user.role ?? "user"}
                  </Badge>
                }
                icon={Shield}
              />
              <ReadOnlyField
                label="Status"
                value={
                  user.banned ? (
                    <Badge variant="destructive">Banned</Badge>
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )
                }
                icon={User}
              />
              <ReadOnlyField
                label="Member since"
                value={format(user.createdAt, "PPP")}
                icon={Calendar}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Account protection and access information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium">Password</p>
                <p className="text-muted-foreground">
                  Password changes are managed through your authentication
                  provider. Contact an administrator if you need help resetting
                  access.
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="font-medium">User ID</p>
                <p className="break-all font-mono text-xs text-muted-foreground">
                  {user.id}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
