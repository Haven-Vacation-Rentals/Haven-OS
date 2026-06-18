/**
 * GET  /api/v1/operations/work-order-costs — Operations Costs rollup
 *      (?date=YYYY-MM-DD | ?from=&to= | ?role= | ?employee=). PAT auth.
 * POST /api/v1/operations/work-order-costs — batch upsert completed work
 *      orders into the dashboard. Idempotent per `external_ref`.
 *
 * The PAT-authenticated REST counterpart to the `upload_work_order_costs`
 * MCP tool — same shared action, for agents that prefer plain HTTP over the
 * MCP connector. Every action is attributed to the token owner.
 */

import { NextResponse } from "next/server";
import { jsonError, readJson, withApi } from "@/lib/api-tokens/route-helpers";
import {
  bulkUpsertWorkOrdersRaw,
  getCostsSummary,
} from "@/lib/operations/work-orders/actions";
import {
  WORK_ORDER_ROLES,
  type WorkOrderRole,
  type CreateWorkOrderInput,
} from "@/lib/operations/work-orders/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asRole(v: unknown): WorkOrderRole {
  return (WORK_ORDER_ROLES as readonly string[]).includes(String(v))
    ? (v as WorkOrderRole)
    : "maintenance_tech";
}

export const GET = withApi(
  { scope: "operations:read" },
  async (req, ctx) => {
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? undefined;
    const from = url.searchParams.get("from") ?? undefined;
    const to = url.searchParams.get("to") ?? undefined;
    const role = url.searchParams.get("role") ?? undefined;
    const employee = url.searchParams.get("employee") ?? undefined;

    const summary = await getCostsSummary(
      {
        date: !from && !to ? date : undefined,
        from,
        to,
        role:
          role && (WORK_ORDER_ROLES as readonly string[]).includes(role)
            ? (role as WorkOrderRole)
            : "all",
        employee: employee ?? "all",
      },
      ctx.admin,
    );
    return NextResponse.json({ summary });
  },
);

interface CostEntry {
  employee_name?: string;
  employee_role?: string;
  amount_charged?: number;
  amount_paid?: number;
  work_date?: string | null;
  title?: string | null;
  description?: string | null;
  property_name?: string | null;
  property_id?: string | null;
  external_ref?: string | null;
  notes?: string | null;
}

interface CreateBody {
  work_orders?: CostEntry[];
}

export const POST = withApi(
  { scope: "operations:write" },
  async (req, ctx) => {
    const body = await readJson<CreateBody>(req);
    if (!body) return jsonError(400, "Invalid JSON body");
    const entries = Array.isArray(body.work_orders) ? body.work_orders : [];
    if (entries.length === 0) {
      return jsonError(400, "work_orders must be a non-empty array");
    }

    const inputs: CreateWorkOrderInput[] = [];
    for (const e of entries) {
      const employee_name = e.employee_name?.trim();
      if (!employee_name) {
        return jsonError(400, "Each work order needs an employee_name");
      }
      if (
        typeof e.amount_charged !== "number" ||
        typeof e.amount_paid !== "number"
      ) {
        return jsonError(
          400,
          `Work order for "${employee_name}" needs numeric amount_charged and amount_paid`,
        );
      }
      inputs.push({
        employee_name,
        employee_role: asRole(e.employee_role),
        amount_charged: e.amount_charged,
        amount_paid: e.amount_paid,
        work_date: e.work_date ?? null,
        title: e.title ?? null,
        description: e.description ?? null,
        property_name: e.property_name ?? null,
        property_id: e.property_id ?? null,
        external_ref: e.external_ref ?? null,
        notes: e.notes ?? null,
      });
    }

    const res = await bulkUpsertWorkOrdersRaw(
      inputs,
      { created_by: ctx.actor.id, source: "agent_upload" },
      ctx.admin,
    );
    if (!res.ok) return jsonError(400, res.error);

    return NextResponse.json(
      {
        ok: true,
        created: res.created,
        updated: res.updated,
        errors: res.errors,
      },
      { status: 201 },
    );
  },
);
