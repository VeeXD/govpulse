import { motion, useReducedMotion } from 'framer-motion';
export default function Reveal({ children, delay = 0 }: { children: any; delay?: number }) {
  const r = useReducedMotion();
  return <motion.div initial={r ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}
