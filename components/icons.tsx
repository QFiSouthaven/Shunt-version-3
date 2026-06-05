
// components/icons.tsx
import React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

// Fixed: Renamed 'stroke' to 'isStrokeIcon' to avoid conflict with SVG's native 'stroke' attribute (string)
const BaseIcon: React.FC<IconProps & { children: React.ReactNode; isStrokeIcon?: boolean }> = ({ 
  children, 
  isStrokeIcon = true, 
  stroke,
  ...props 
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill={isStrokeIcon ? "none" : "currentColor"}
    viewBox="0 0 24 24"
    strokeWidth={isStrokeIcon ? 1.5 : undefined}
    stroke={isStrokeIcon ? "currentColor" : (stroke as string)}
    {...props}
  >
    {children}
  </svg>
);

export const AppIcon: React.FC<IconProps> = (props) => (
  <BaseIcon isStrokeIcon={false} {...props} viewBox="0 0 24 24">
    <path d="M12.378 1.602a.75.75 0 00-.756 0L3.366 6.166A.75.75 0 003 6.821v10.358c0 .32.2.613.518.715l8.256 2.628a.75.75 0 00.452 0l8.256-2.628a.75.75 0 00.518-.715V6.821a.75.75 0 00-.366-.655L12.378 1.602zM12 15.195l-7.5-2.39v-4.2l7.5 2.39v4.2z" />
  </BaseIcon>
);

export const MenuIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></BaseIcon>
);

export const HomeIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></BaseIcon>
);

export const QueueListIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" /></BaseIcon>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></BaseIcon>
);

export const SignalIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M8.25 21v-1.5M21 15.75h-1.5M15.75 3v1.5M15.75 21v-1.5m-7.5 0v-1.5m7.5-15v1.5m-7.5-1.5v1.5M3 15.75h1.5m1.5-12H3m12 0h-1.5m-1.5 18h-1.5m-1.5-1.5v-1.5m1.5 1.5v1.5m0-1.5v-1.5m0 0v-1.5m-1.5 0h1.5m-1.5 0h-1.5m3 0h1.5m-4.5 0h1.5m3 0h-1.5m-1.5 0h1.5m3 0h-1.5m-1.5 0h1.5m0 0h1.5m0-1.5v-1.5m0-1.5v-1.5m0-1.5v-1.5m0 0V9m0 0v-1.5m-1.5 0H9m-1.5 0H6m1.5 0h-1.5m3 0h1.5M9 9h1.5m1.5 1.5v-1.5m1.5 0v-1.5m0 0v-1.5m1.5 0v1.5m0 0v1.5m-1.5 0v1.5m-1.5 0v1.5M9 15v-1.5m-1.5 0v1.5m1.5 0v-1.5m1.5 0v-1.5M9 9v1.5m3 0v1.5m-1.5 0v-1.5m0 0v1.5m1.5 0v-1.5" /></BaseIcon>
);

export const BookIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></BaseIcon>
);

export const CodeIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></BaseIcon>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></BaseIcon>
);

export const BoltIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></BaseIcon>
);

export const XMarkIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></BaseIcon>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></BaseIcon>
);

export const TerminalIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" /></BaseIcon>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></BaseIcon>
);

export const CheckCircleIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></BaseIcon>
);

export const EditIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></BaseIcon>
);

export const JsonIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></BaseIcon>
);

export const KeywordsIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" /></BaseIcon>
);

export const SmileIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75s.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></BaseIcon>
);

export const TieIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" /></BaseIcon>
);

export const AmplifyIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></BaseIcon>
);

export const AmplifyX2Icon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></BaseIcon>
);

export const BrainIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6c0-3.314-2.686-6-6-6s-6 2.686-6 6c0 3.314 2.686 6 6 6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-3 0a3 3 0 106 0 3 3 0 10-6 0" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V3m0 18v-2.25m6-12.75l2.25-2.25M3.75 18l2.25-2.25m12 0l2.25 2.25M3.75 6l2.25 2.25" /></BaseIcon>
);

export const FeatherIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75l3-3m0 0l-3-3m3 3H9m3.375-9h-1.5a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 0010.875 21h1.5a2.25 2.25 0 002.25-2.25V9.75A2.25 2.25 0 0013.125 7.5z" /></BaseIcon>
);

export const JsonToTextIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></BaseIcon>
);

export const ActionableIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></BaseIcon>
);

export const PuzzlePieceIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-.84-1.875-1.875-1.875s-1.875.84-1.875 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875.84-1.875 1.875s.84 1.875 1.875 1.875c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035.84-1.875 1.875-1.875s1.875.84 1.875 1.875c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959v0c0 .31.239.554.55.542a48.254 48.254 0 015.74-.355 48.14 48.14 0 01.355-5.74.616.616 0 00-.541-.55v0c-.355 0-.676.186-.959.401a1.647 1.647 0 01-1.003.349c-1.036 0-1.875-.84-1.875-1.875s.84-1.875 1.875-1.875c.369 0 .713.128 1.003.349.283.215.604.401.959.401v0a.656.656 0 00.663-.658c.022-1.657.13-3.294.314-4.907a48.39 48.39 0 00-4.162.3.64.64 0 01-.657-.643v0z" /></BaseIcon>
);

export const PhotoIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6.75a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6.75v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></BaseIcon>
);

export const EntityIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></BaseIcon>
);

export const DocumentChartBarIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></BaseIcon>
);

export const BranchingIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.188 2.257c2.208-1.074 4.824-1.074 7.032 0m-7.032 0a1.5 1.5 0 00-.828 1.356V16.5m8.688-14.243a1.5 1.5 0 01.828 1.356V16.5m-9.516 3.126l.162-.008a6.75 6.75 0 006.702-6.702l.008-.162M10.5 10.5h.008v.008H10.5V10.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></BaseIcon>
);

export const GlobeAltIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A8.959 8.959 0 013 12c0-.778.099-1.533.284-2.253" /></BaseIcon>
);

export const MinusIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></BaseIcon>
);

export const DeveloperIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" /></BaseIcon>
);

export const RedoIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></BaseIcon>
);

export const ServerStackIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 1.035-3.694 1.875-8.25 1.875s-8.25-.84-8.25-1.875S7.444 4.5 12 4.5s8.25.84 8.25 1.875zM20.25 12c0 1.035-3.694 1.875-8.25 1.875s-8.25-.84-8.25-1.875-4.556-1.875 12-1.875 8.25.84 8.25 1.875zM20.25 17.625c0 1.035-3.694 1.875-8.25 1.875s-8.25-.84-8.25-1.875-4.556-1.875 12-1.875 8.25.84 8.25 1.875z" /></BaseIcon>
);

export const StarIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></BaseIcon>
);

export const EyeIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></BaseIcon>
);

export const ShieldCheckIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></BaseIcon>
);

export const DeviceFloppyIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></BaseIcon>
);

export const LockIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></BaseIcon>
);

export const PaperAirplaneIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></BaseIcon>
);

export const ErrorIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></BaseIcon>
);

export const FeedbackIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h3m-6.75 5.25a3 3 0 003 3h10.5a3 3 0 003-3v-10.5a3 3 0 00-3-3H5.25a3 3 0 00-3 3v10.5a3 3 0 003 3z" /></BaseIcon>
);

export const MailboxIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></BaseIcon>
);

export const BlueprintIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" /></BaseIcon>
);

export const ExternalLinkIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></BaseIcon>
);

export const RoadmapIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446a.75.75 0 01-.888.347l-3.328-1.11a.75.75 0 00-.474 0l-3.328 1.11a.75.75 0 01-.888-.347V4.085a.75.75 0 01.442-.683l3.328-1.331a.75.75 0 01.616 0l3.328 1.331a.75.75 0 01.442.683v16.11z" /></BaseIcon>
);

export const CloudArrowDownIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75v6.75m0 0l-3-3m3 3l3-3m-8.25 6a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></BaseIcon>
);

export const UploadIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></BaseIcon>
);

export const ClipboardDocumentListIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.707c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 011.927-.184" /></BaseIcon>
);

export const CopyIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" /></BaseIcon>
);

export const DocumentArrowDownIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></BaseIcon>
);

export const ServerIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3V7.5a3 3 0 013-3h13.5a3 3 0 013 3v3.75a3 3 0 01-3 3m-13.5 0a3 3 0 00-3 3v3.75a3 3 0 003 3h13.5a3 3 0 003-3v-3.75a3 3 0 00-3-3" /></BaseIcon>
);

export const ViewfinderCircleIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></BaseIcon>
);

export const ViewColumnsIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.5 0h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H4.5A2.25 2.25 0 002.25 6.75v10.5A2.25 2.25 0 004.5 19.5z" /></BaseIcon>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></BaseIcon>
);

export const WrenchIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.423 3.007a3 3 0 00-3.468 2.63l-.069.492a9.979 9.979 0 01-2.135 4.31l-.22.22a3 3 0 000 4.242l.616.616a3 3 0 004.242 0l.22-.22a9.98 9.98 0 014.31-2.135l.492-.069a3 3 0 002.63-3.468V8.17a3 3 0 00-2.63-3.468l-.492-.069a9.98 9.98 0 01-4.31-2.135l-.22-.22z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17.914 11.205A2.999 2.999 0 1115.79 5.187m3.128 10.734a9 9 0 11-8.127-8.127" /></BaseIcon>
);

export const InformationCircleIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></BaseIcon>
);

export const RocketLaunchIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></BaseIcon>
);

export const LightBulbIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v3.75m9-11.25a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></BaseIcon>
);

export const Cog6ToothIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.332.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></BaseIcon>
);

export const FolderIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-18.75 0a2.25 2.25 0 00-2.25 2.25v4.5A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25v-4.5a2.25 2.25 0 00-2.25-2.25m-18.75 0h18.75m-14.25-5.25L12 4.5l3 3m-3-3V15" /></BaseIcon>
);

export const DocumentIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></BaseIcon>
);

export const ClipboardDocumentIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.707c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 011.927-.184" /></BaseIcon>
);

export const ChatBubbleLeftRightIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-9 3h3m-6.75 5.25a3 3 0 003 3h10.5a3 3 0 003-3v-10.5a3 3 0 00-3-3H5.25a3 3 0 00-3 3v10.5a3 3 0 003 3z" /></BaseIcon>
);

export const PlayIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" /></BaseIcon>
);

export const UndoIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></BaseIcon>
);

export const FireIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" /></BaseIcon>
);

export const SpeakerWaveIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" /></BaseIcon>
);

export const MousePointerIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></BaseIcon>
);

export const CogIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0 7.5 7.5 0 00-15 0zm0 0a1.5 1.5 0 011.5-1.5h12a1.5 1.5 0 011.5 1.5m-15 0a1.5 1.5 0 001.5 1.5h12a1.5 1.5 0 001.5-1.5M12 4.5v15m7.5-7.5h-15" /></BaseIcon>
);

export const ArrowPathIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></BaseIcon>
);

export const CursorArrowRaysIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" /></BaseIcon>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></BaseIcon>
);

export const ExclamationTriangleIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></BaseIcon>
);

export const NoSymbolIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></BaseIcon>
);

export const SpeakerXMarkIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L15.75 11.25m0 0L14.25 12.75m1.5-1.5L14.25 9.75m1.5 1.5L17.25 12.75M12 4.5l-4.72 4.72H4.51c-.88 0-1.704.507-1.938 1.354A9.01 9.01 0 002.25 12c0 .83.112-1.633.322 2.396.234.847 1.058 1.354 1.938 1.354h2.77L12 19.5V4.5z" /></BaseIcon>
);

export const DatabaseIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></BaseIcon>
);

export const MapIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.446a.75.75 0 0 1-.888.347l-3.328-1.11a.75.75 0 0 0-.474 0l-3.328 1.11a.75.75 0 0 1-.888-.347V4.085a.75.75 0 0 1 .442-.683l3.328-1.331a.75.75 0 0 1 .616 0l3.328 1.331a.75.75 0 0 1 .442.683v16.11Z" /></BaseIcon>
);

// Added: Missing Icons needed for system functionality
export const CpuChipIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5M15.75 21v-1.5m-7.5 0v-1.5m7.5-15v1.5m-7.5-1.5v1.5M3 15.75h1.5m1.5-12H3m12 0h-1.5m-1.5 18h-1.5m-1.5-1.5v-1.5m1.5 1.5v1.5m0-1.5v-1.5m0 0v-1.5m-1.5 0h1.5m-1.5 0h-1.5m3 0h1.5m-4.5 0h1.5m3 0h-1.5m-1.5 0h1.5m3 0h-1.5m-1.5 0h1.5m0 0h1.5m0-1.5v-1.5m0-1.5v-1.5m0-1.5v-1.5m0 0V9m0 0v-1.5m-1.5 0H9m-1.5 0H6m1.5 0h-1.5m3 0h1.5M9 9h1.5m1.5 1.5v-1.5m1.5 0v-1.5m0 0v-1.5m1.5 0v1.5m0 0v1.5m-1.5 0v1.5m-1.5 0v1.5M9 15v-1.5m-1.5 0v1.5m1.5 0v-1.5m1.5 0v-1.5M9 9v1.5m3 0v1.5m-1.5 0v-1.5m0 0v1.5m1.5 0v-1.5" /></BaseIcon>
);

export const UserIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></BaseIcon>
);

export const HistoryIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></BaseIcon>
);

export const DocumentDuplicateIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v8.25A2.25 2.25 0 0 0 6 16.5h2.25m8.25-8.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-7.5A2.25 2.25 0 0 1 8.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 0 0-2.25 2.25v6" /></BaseIcon>
);

export const FlagIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1 0-5.715l-3.114.732a9 9 0 0 1-6.086-.71l-.108-.054a9 9 0 0 0-6.208-.682L3 9.5M3 15V9.5" /></BaseIcon>
);

export const TrimIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 2.231 0 2.165 2.165 0 0 0 2.231 0M9.384 9.137l2.097 1.21M9.384 9.137L7.287 7.925M14.016 9.137l2.096-1.21M14.016 9.137l-1.536.887M16.112 7.927a3 3 0 1 1 5.196-3 3 3 0 0 1-5.196 3Zm-4.629 2.42l-2.097 1.21m2.097-1.21l2.096 1.21m-2.096-1.21V19.5M9.384 11.557v7.943m4.632-7.943v7.943" /></BaseIcon>
);
