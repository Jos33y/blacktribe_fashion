/*
 * Where Journal pictures live.
 * Magazine photos sit in the Supabase "editorial" bucket (same place the
 * magazine uses). Site photos (hero, store) sit in /public.
 */
export const EDITORIAL_MEDIA = 'https://jshohwwdaxwfxpklcpsp.supabase.co/storage/v1/object/public/editorial';

export const ed = (path) => `${EDITORIAL_MEDIA}/${path}`;
