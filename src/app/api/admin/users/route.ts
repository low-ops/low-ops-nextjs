import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { isAdminRole } from "@/lib/admin-auth";
import { auth } from "@/lib/auth";
import { withApiHeaders } from "@/lib/http-headers";
import { logger } from "@/lib/logger";
import { getUsers } from "@/utils/users";

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!isAdminRole(session?.user.role)) {
    const response = NextResponse.json(
      { error: "You do not have permission to view users." },
      { status: 403 },
    );
    return withApiHeaders(request, response);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get("sortBy") || undefined;
    let sortDirection = searchParams.get("sortDirection") || undefined;
    if (sortDirection !== "asc" && sortDirection !== "desc") {
      sortDirection = undefined;
    }
    const role = searchParams.get("role") || undefined;
    const status = searchParams.get("status") || undefined;
    const email = searchParams.get("email") || undefined;
    const name = searchParams.get("name") || undefined;

    const { users, total } = await getUsers({
      limit,
      offset,
      sortBy,
      sortDirection,
      role,
      status,
      email,
      name,
    });

    const response = NextResponse.json({
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
    return withApiHeaders(request, response);
  } catch (error) {
    logger.error("Error fetching users", {
      error: error instanceof Error ? error.message : String(error),
    });

    const response = NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
    return withApiHeaders(request, response);
  }
}

export async function OPTIONS(request: NextRequest) {
  return withApiHeaders(request, new NextResponse(null, { status: 204 }));
}
