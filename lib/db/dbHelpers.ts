import { createSupabaseAdminClient } from "@/services/supabase/admin";
import { logger } from "@/lib/logger";

export type DbResult<T> = {
  data: T | null;
  error?: string;
};

export type DbWriteResult<T> = {
  ok: boolean;
  data?: T | null;
  error?: string;
};

export async function fetchSingleBy<T>(
  table: string,
  column: string,
  value: string,
): Promise<DbResult<T>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(column, value)
      .maybeSingle();

    if (error) {
      logger.error("DB fetch failed.", error, { table, column, value });
      return { data: null, error: error.message };
    }

    return { data: data as T };
  } catch (error) {
    logger.error("DB fetch crashed.", error, { table, column, value });
    return { data: null, error: "Unexpected error" };
  }
}

export async function upsertRow<T>(
  table: string,
  record: T,
  onConflict: string,
): Promise<DbWriteResult<T>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(table)
      .upsert(record, { onConflict })
      .select("*")
      .maybeSingle();

    if (error) {
      logger.error("DB upsert failed.", error, { table, onConflict });
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as T };
  } catch (error) {
    logger.error("DB upsert crashed.", error, { table, onConflict });
    return { ok: false, error: "Unexpected error" };
  }
}

export async function updateRowBy<T>(
  table: string,
  column: string,
  value: string,
  patch: Partial<T>,
): Promise<DbWriteResult<T>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(table)
      .update(patch)
      .eq(column, value)
      .select("*")
      .maybeSingle();

    if (error) {
      logger.error("DB update failed.", error, { table, column, value });
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as T };
  } catch (error) {
    logger.error("DB update crashed.", error, { table, column, value });
    return { ok: false, error: "Unexpected error" };
  }
}

export async function insertRow<T>(
  table: string,
  record: T,
): Promise<DbWriteResult<T>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select("*")
      .maybeSingle();

    if (error) {
      logger.error("DB insert failed.", error, { table });
      return { ok: false, error: error.message };
    }

    return { ok: true, data: data as T };
  } catch (error) {
    logger.error("DB insert crashed.", error, { table });
    return { ok: false, error: "Unexpected error" };
  }
}
