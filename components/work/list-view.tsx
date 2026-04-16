"use client";

/**
 * list-view.tsx — thin re-export shim.
 *
 * The previous 310-line implementation has been superseded by ListViewTable
 * in list-view-table.tsx. This file is kept to avoid breaking any existing
 * imports that reference <ListView /> from the old page.tsx.
 *
 * The new list page (app/(app)/work/list/[listId]/page.tsx) renders
 * <ListViewTable> directly.
 */

export { ListViewTable as ListView } from "./list-view-table";
