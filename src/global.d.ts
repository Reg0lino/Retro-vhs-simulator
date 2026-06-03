declare module 'gifshot';
declare module 'gifler';

interface Window {
  Hls: any;
  gifler: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    'canvas': React.DetailedHTMLProps<React.CanvasHTMLProps<HTMLCanvasElement>, HTMLCanvasElement>;
  }
}