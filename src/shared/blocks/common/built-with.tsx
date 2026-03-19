import Link from 'next/link';

import { Button } from '@/shared/components/ui/button';

export function BuiltWith() {
  return (
    <Button asChild variant="outline" size="sm" className="hover:bg-primary/10">
      <Link href="https://www.linkflowai.app" target="_blank">
        Powered by LinkFlow AI
      </Link>
    </Button>
  );
}
