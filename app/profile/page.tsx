import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getGravatarUrl } from "@/lib/gravatar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { ProfileForm } from "@/components/user/profile-form";
import { PasswordForm } from "@/components/user/password-form";
import { DeleteAccount } from "@/components/user/delete-account";

export default async function ProfilePage() {
  const headersList = await headers();
  const user = await getCurrentUser(headersList);

  if (!user) {
    redirect("/login");
  }

  // Fetch full user data
  const users = await sql`
    SELECT id, username, email, created_at, updated_at
    FROM vph_users WHERE id = ${user.userId}
  `;

  if (users.length === 0) {
    redirect("/login");
  }

  // Serialize to plain objects for Client Component props
  const userData = JSON.parse(JSON.stringify(users[0]));

  return (
    <div className="flex flex-col flex-1">
      <div className="border-b px-6 py-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>个人信息</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* User header */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={getGravatarUrl(userData.email, 128)}
                alt={userData.username}
              />
              <AvatarFallback className="text-2xl">
                {userData.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{userData.username}</h1>
              <p className="text-sm text-muted-foreground">{userData.email}</p>
              <p className="text-xs text-muted-foreground">
                头像由 Gravatar 提供
              </p>
            </div>
          </div>

          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">基本信息</TabsTrigger>
              <TabsTrigger value="password">修改密码</TabsTrigger>
              <TabsTrigger value="danger">危险操作</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="mt-4">
              <ProfileForm
                initialUsername={userData.username}
                initialEmail={userData.email}
              />
            </TabsContent>

            <TabsContent value="password" className="mt-4">
              <PasswordForm />
            </TabsContent>

            <TabsContent value="danger" className="mt-4">
              <DeleteAccount />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
