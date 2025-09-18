// World type declarations

declare module '*.mdx' {
  import { ComponentType } from 'react';
  
  interface MDXProps {
    [key: string]: any;
  }
  
  const MDXComponent: ComponentType<MDXProps>;
  export default MDXComponent;
}

declare module '*.md' {
  import { ComponentType } from 'react';
  
  interface MDXProps {
    [key: string]: any;
  }
  
  const MDXComponent: ComponentType<MDXProps>;
  export default MDXComponent;
} 