import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  const path = request.nextUrl.searchParams.get('path');

  if (slug) {
    revalidatePath(`/plants/${slug}`);
    return NextResponse.json({ revalidated: true, slug });
  }

  if (path) {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  }

  return NextResponse.json({ error: 'Missing slug or path param' }, { status: 400 });
}
