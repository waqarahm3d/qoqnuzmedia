/**
 * UI Component Library
 *
 * Centralized exports for all base UI components.
 *
 * @example
 * ```tsx
 * import { Button, Card, AlbumCard, Input } from '@/components/ui';
 * ```
 */

// Button Components
export { Button, buttonVariants, type ButtonProps } from './button/Button';

// Card Components
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
  type CardProps,
} from './card/Card';

export { AlbumCard, type AlbumCardProps } from './card/AlbumCard';
export { TrackCard, type TrackCardProps } from './card/TrackCard';

// Input Components
export { Input, inputVariants, type InputProps } from './input/Input';
export { SearchInput, type SearchInputProps } from './input/SearchInput';
