import React, {
  memo,
  ReactNode,
  useState,
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  forwardRef,
} from 'react';
import {
  motion,
  useAnimation,
  useInView,
  useMotionTemplate,
  useMotionValue,
} from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== Input Component ====================

const Input = memo(
  forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
    function Input({ className, type, ...props }, ref) {
      const radius = 100;
      const [visible, setVisible] = useState(false);

      const mouseX = useMotionValue(0);
      const mouseY = useMotionValue(0);

      function handleMouseMove({
        currentTarget,
        clientX,
        clientY,
      }: React.MouseEvent<HTMLDivElement>) {
        const { left, top } = currentTarget.getBoundingClientRect();

        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      }

      return (
        <motion.div
          style={{
            background: useMotionTemplate`
          radial-gradient(
            ${visible ? radius + 'px' : '0px'} circle at ${mouseX}px ${mouseY}px,
            #3b82f6,
            transparent 80%
          )
        `,
          }}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setVisible(true)}
          onMouseLeave={() => setVisible(false)}
          className='group/input rounded-xl p-[2px] transition duration-300'
        >
          <input
            type={type}
            className={cn(
              `flex h-11 w-full rounded-xl border border-blue-900/60 bg-[#091124] px-4 py-2.5 text-sm text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition duration-300 disabled:cursor-not-allowed disabled:opacity-50`,
              className
            )}
            ref={ref}
            {...props}
          />
        </motion.div>
      );
    }
  )
);

Input.displayName = 'Input';

// ==================== BoxReveal Component ====================

type BoxRevealProps = {
  children: ReactNode;
  width?: string;
  boxColor?: string;
  duration?: number;
  overflow?: string;
  position?: string;
  className?: string;
};

const BoxReveal = memo(function BoxReveal({
  children,
  width = 'fit-content',
  boxColor,
  duration,
  overflow = 'hidden',
  position = 'relative',
  className,
}: BoxRevealProps) {
  const mainControls = useAnimation();
  const slideControls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      slideControls.start('visible');
      mainControls.start('visible');
    } else {
      slideControls.start('hidden');
      mainControls.start('hidden');
    }
  }, [isInView, mainControls, slideControls]);

  return (
    <section
      ref={ref}
      style={{
        position: position as
          | 'relative'
          | 'absolute'
          | 'fixed'
          | 'sticky'
          | 'static',
        width,
        overflow,
      }}
      className={className}
    >
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 35 },
          visible: { opacity: 1, y: 0 },
        }}
        initial='hidden'
        animate={mainControls}
        transition={{ duration: duration ?? 0.5, delay: 0.15 }}
      >
        {children}
      </motion.div>
      <motion.div
        variants={{ hidden: { left: 0 }, visible: { left: '100%' } }}
        initial='hidden'
        animate={slideControls}
        transition={{ duration: duration ?? 0.5, ease: 'easeIn' }}
        style={{
          position: 'absolute',
          top: 2,
          bottom: 2,
          left: 0,
          right: 0,
          zIndex: 20,
          background: boxColor ?? '#2563eb',
          borderRadius: 4,
        }}
      />
    </section>
  );
});

// ==================== Ripple Component ====================

type RippleProps = {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
};

const Ripple = memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.28,
  numCircles = 10,
  className = '',
}: RippleProps) {
  return (
    <section
      className={`absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden [mask-image:radial-gradient(ellipse_at_center,white_40%,transparent_75%)] ${className}`}
    >
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 65;
        const opacity = Math.max(0.05, mainCircleOpacity - i * 0.025);
        const animationDelay = `${i * 0.08}s`;
        const borderStyle = i === numCircles - 1 ? 'dashed' : 'solid';

        return (
          <span
            key={i}
            className='absolute animate-ripple rounded-full border border-blue-400/30'
            style={{
              width: `${size}px`,
              height: `${size}px`,
              opacity: opacity,
              animationDelay: animationDelay,
              borderStyle: borderStyle,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        );
      })}
    </section>
  );
});

// ==================== OrbitingCircles Component ====================

type OrbitingCirclesProps = {
  className?: string;
  children: ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
};

const OrbitingCircles = memo(function OrbitingCircles({
  className,
  children,
  reverse = false,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
}: OrbitingCirclesProps) {
  return (
    <>
      {path && (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          version='1.1'
          className='pointer-events-none absolute inset-0 size-full'
        >
          <circle
            className='stroke-blue-500/20 stroke-1'
            cx='50%'
            cy='50%'
            r={radius}
            fill='none'
          />
        </svg>
      )}
      <section
        style={
          {
            '--duration': duration,
            '--radius': radius,
            '--delay': -delay,
          } as React.CSSProperties
        }
        className={cn(
          'absolute flex size-full transform-gpu animate-orbit items-center justify-center rounded-full pointer-events-none',
          { '[animation-direction:reverse]': reverse },
          className
        )}
      >
        <div className="pointer-events-auto">{children}</div>
      </section>
    </>
  );
});

// ==================== TechOrbitDisplay Component ====================

export type IconConfig = {
  className?: string;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  reverse?: boolean;
  component: () => React.ReactNode;
};

type TechnologyOrbitDisplayProps = {
  iconsArray: IconConfig[];
  text?: string;
  subText?: string;
};

const TechOrbitDisplay = memo(function TechOrbitDisplay({
  iconsArray,
  text = 'RevenueRescue AI',
  subText = 'Autonomous Recovery & RBAC Mission Control',
}: TechnologyOrbitDisplayProps) {
  return (
    <section className='relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl'>
      <div className="z-10 text-center space-y-2 pointer-events-none select-none px-4">
        <span className='whitespace-pre-wrap bg-gradient-to-b from-white via-blue-100 to-blue-400 bg-clip-text text-center text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-transparent block drop-shadow-sm'>
          {text}
        </span>
        {subText && (
          <span className="text-xs sm:text-sm font-mono text-blue-200/90 font-semibold tracking-wider uppercase block">
            {subText}
          </span>
        )}
      </div>

      {iconsArray.map((icon, index) => (
        <OrbitingCircles
          key={index}
          className={icon.className}
          duration={icon.duration}
          delay={icon.delay}
          radius={icon.radius}
          path={icon.path}
          reverse={icon.reverse}
        >
          {icon.component()}
        </OrbitingCircles>
      ))}
    </section>
  );
});

// ==================== BottomGradient Component ====================

const BottomGradient = () => {
  return (
    <>
      <span className='group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-[2px] w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent' />
      <span className='group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-[2px] w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-400 to-transparent' />
    </>
  );
};

// ==================== Label Component ====================

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  htmlFor?: string;
}

const Label = memo(function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'text-xs font-semibold text-slate-200 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  );
});

// ==================== AnimatedForm Component ====================

type FieldType = 'text' | 'email' | 'password';

type Field = {
  label: string;
  required?: boolean;
  type: FieldType;
  placeholder?: string;
  value?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type AnimatedFormProps = {
  header: string;
  subHeader?: string;
  fields: Field[];
  submitButton: string;
  textVariantButton?: string;
  errorField?: string;
  fieldPerRow?: number;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  googleLogin?: string;
  onGoogleLogin?: () => void;
  goTo?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  childrenBeforeFields?: React.ReactNode;
  childrenAfterSubmit?: React.ReactNode;
  isLoading?: boolean;
};

type Errors = {
  [key: string]: string;
};

const AnimatedForm = memo(function AnimatedForm({
  header,
  subHeader,
  fields,
  submitButton,
  textVariantButton,
  errorField,
  fieldPerRow = 1,
  onSubmit,
  googleLogin,
  onGoogleLogin,
  goTo,
  childrenBeforeFields,
  childrenAfterSubmit,
  isLoading = false,
}: AnimatedFormProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});

  const toggleVisibility = () => setVisible(!visible);

  const validateForm = (event: FormEvent<HTMLFormElement>) => {
    const currentErrors: Errors = {};
    fields.forEach((field) => {
      const inputElement = (event.target as HTMLFormElement)[field.label] as HTMLInputElement;
      const value = inputElement ? inputElement.value : (field.value || '');

      if (field.required && !value) {
        currentErrors[field.label] = `${field.label} is required`;
      }

      if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        currentErrors[field.label] = 'Invalid work email address';
      }
    });
    return currentErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formErrors = validateForm(event);

    if (Object.keys(formErrors).length === 0) {
      setErrors({});
      onSubmit(event);
    } else {
      setErrors(formErrors);
    }
  };

  return (
    <section className='w-full max-w-md flex flex-col gap-4 mx-auto'>
      <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
        <h2 className='font-black text-2xl sm:text-3xl text-white tracking-tight'>
          {header}
        </h2>
      </BoxReveal>

      {subHeader && (
        <BoxReveal boxColor='var(--skeleton)' duration={0.3} className='pb-1'>
          <p className='text-blue-200/80 text-xs sm:text-sm max-w-sm'>
            {subHeader}
          </p>
        </BoxReveal>
      )}

      {childrenBeforeFields}

      {googleLogin && (
        <>
          <BoxReveal
            boxColor='var(--skeleton)'
            duration={0.3}
            overflow='visible'
            width='100%'
          >
            <button
              className='g-button relative group/btn bg-[#0c1630] hover:bg-[#112044] w-full rounded-xl border border-blue-900/60 h-11 font-semibold text-xs text-white outline-none hover:cursor-pointer transition-all shadow-sm'
              type='button'
              onClick={onGoogleLogin}
            >
              <span className='flex items-center justify-center w-full h-full gap-2.5'>
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 8.9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                </svg>
                {googleLogin}
              </span>
              <BottomGradient />
            </button>
          </BoxReveal>

          <BoxReveal boxColor='var(--skeleton)' duration={0.3} width='100%'>
            <section className='flex items-center gap-3 py-1'>
              <hr className='flex-1 border-t border-blue-900/60' />
              <p className='text-blue-300/60 text-[11px] font-mono'>
                or enter corporate credentials
              </p>
              <hr className='flex-1 border-t border-blue-900/60' />
            </section>
          </BoxReveal>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <section
          className={`grid grid-cols-1 md:grid-cols-${fieldPerRow} gap-3`}
        >
          {fields.map((field) => (
            <section key={field.label} className='flex flex-col gap-1.5'>
              <BoxReveal boxColor='var(--skeleton)' duration={0.3}>
                <Label htmlFor={field.label}>
                  {field.label} {field.required && <span className='text-blue-400'>*</span>}
                </Label>
              </BoxReveal>

              <BoxReveal
                width='100%'
                boxColor='var(--skeleton)'
                duration={0.3}
                className='flex flex-col w-full'
              >
                <section className='relative'>
                  <Input
                    type={
                      field.type === 'password'
                        ? visible
                          ? 'text'
                          : 'password'
                        : field.type
                    }
                    name={field.label}
                    id={field.label}
                    value={field.value}
                    placeholder={field.placeholder}
                    onChange={field.onChange}
                  />

                  {field.type === 'password' && (
                    <button
                      type='button'
                      onClick={toggleVisibility}
                      className='absolute inset-y-0 right-0 pr-3.5 flex items-center text-blue-300/60 hover:text-white cursor-pointer'
                    >
                      {visible ? (
                        <Eye className='h-4 w-4' />
                      ) : (
                        <EyeOff className='h-4 w-4' />
                      )}
                    </button>
                  )}
                </section>

                {errors[field.label] && (
                  <p className='text-rose-400 text-xs mt-1 font-mono'>
                    {errors[field.label]}
                  </p>
                )}
              </BoxReveal>
            </section>
          ))}
        </section>

        {errorField && (
          <BoxReveal width='100%' boxColor='var(--skeleton)' duration={0.3}>
            <div className='p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs font-mono'>
              {errorField}
            </div>
          </BoxReveal>
        )}

        <BoxReveal
          width='100%'
          boxColor='var(--skeleton)'
          duration={0.3}
          overflow='visible'
        >
          <button
            className='bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 relative group/btn block w-full text-white rounded-xl h-11 font-bold text-xs shadow-lg shadow-blue-600/30 outline-none hover:cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50'
            type='submit'
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Authenticating Access...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>{submitButton}</span>
                <span>&rarr;</span>
              </span>
            )}
            <BottomGradient />
          </button>
        </BoxReveal>

        {textVariantButton && goTo && (
          <BoxReveal boxColor='var(--skeleton)' duration={0.3} width="100%">
            <section className='text-center pt-1'>
              <button
                type='button'
                className='text-xs text-blue-400 hover:text-blue-300 font-medium hover:cursor-pointer outline-none transition-colors'
                onClick={goTo}
              >
                {textVariantButton}
              </button>
            </section>
          </BoxReveal>
        )}

        {childrenAfterSubmit}
      </form>
    </section>
  );
});

// ==================== AuthTabs Component ====================

interface AuthTabsProps {
  children: React.ReactNode;
}

const AuthTabs = memo(function AuthTabs({
  children,
}: AuthTabsProps) {
  return (
    <div className='w-full flex items-center justify-center p-4 sm:p-8'>
      {children}
    </div>
  );
});

// ==================== Exports ====================

export {
  Input,
  BoxReveal,
  Ripple,
  OrbitingCircles,
  TechOrbitDisplay,
  AnimatedForm,
  AuthTabs,
  Label,
  BottomGradient,
};
