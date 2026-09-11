"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Uniforms = {
  [key: string]: {
    value: number[] | number[][] | number;
    type: string;
  };
};

interface ShaderProps {
  source: string;
  uniforms: {
    [key: string]: {
      value: number[] | number[][] | number;
      type: string;
    };
  };
  maxFps?: number;
}

interface SignInPageProps {
  className?: string;
  onSuccess?: () => void;
  accentColors?: number[][];
}
      
export const CanvasRevealEffect = ({
  animationSpeed = 4,
  opacities = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1],
  colors = [[16, 185, 129], [20, 184, 166], [6, 182, 212]],
  containerClassName,
  dotSize = 3,
  showGradient = true,
  reverse = false,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div className={cn("h-full relative w-full", containerClassName)}>
      <div className="h-full w-full">
        <DotMatrix
          colors={colors ?? [[16, 185, 129], [20, 184, 166], [6, 182, 212]]}
          dotSize={dotSize ?? 3}
          opacities={
            opacities ?? [0.2, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
          }
          shader={`
            ${reverse ? 'u_reverse_active' : 'false'}_;
            animation_speed_factor_${animationSpeed.toFixed(1)}_;
          `}
          center={["x", "y"]}
        />
      </div>
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

interface DotMatrixProps {
  colors?: number[][];
  opacities?: number[];
  totalSize?: number;
  dotSize?: number;
  shader?: string;
  center?: ("x" | "y")[];
}

const DotMatrix: React.FC<DotMatrixProps> = ({
  colors = [[16, 185, 129]],
  opacities = [0.04, 0.04, 0.04, 0.04, 0.04, 0.08, 0.08, 0.08, 0.08, 0.14],
  totalSize = 20,
  dotSize = 2,
  shader = "",
  center = ["x", "y"],
}) => {
  const uniforms = React.useMemo(() => {
    let colorsArray = [
      colors[0] || [16, 185, 129],
      colors[0] || [16, 185, 129],
      colors[0] || [16, 185, 129],
      colors[0] || [16, 185, 129],
      colors[0] || [16, 185, 129],
      colors[0] || [16, 185, 129],
    ];
    if (colors.length === 2) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[1],
      ];
    } else if (colors.length >= 3) {
      colorsArray = [
        colors[0],
        colors[0],
        colors[1],
        colors[1],
        colors[2],
        colors[2],
      ];
    }
    return {
      u_colors: {
        value: colorsArray.map((color) => [
          color[0] / 255,
          color[1] / 255,
          color[2] / 255,
        ]),
        type: "uniform3fv",
      },
      u_opacities: {
        value: opacities,
        type: "uniform1fv",
      },
      u_total_size: {
        value: totalSize,
        type: "uniform1f",
      },
      u_dot_size: {
        value: dotSize,
        type: "uniform1f",
      },
      u_reverse: {
        value: shader.includes("u_reverse_active") ? 1 : 0,
        type: "uniform1i",
      },
    };
  }, [colors, opacities, totalSize, dotSize, shader]);

  return (
    <Shader
      source={`
        precision mediump float;
        in vec2 fragCoord;

        uniform float u_time;
        uniform float u_opacities[10];
        uniform vec3 u_colors[6];
        uniform float u_total_size;
        uniform float u_dot_size;
        uniform vec2 u_resolution;
        uniform int u_reverse;

        out vec4 fragColor;

        float PHI = 1.61803398874989484820459;
        float random(vec2 xy) {
            return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
        }
        float map(float value, float min1, float max1, float min2, float max2) {
            return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
        }

        void main() {
            vec2 st = fragCoord.xy;
            ${
              center.includes("x")
                ? "st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));"
                : ""
            }
            ${
              center.includes("y")
                ? "st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));"
                : ""
            }

            float opacity = step(0.0, st.x);
            opacity *= step(0.0, st.y);

            vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

            float frequency = 5.0;
            float show_offset = random(st2);
            float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
            opacity *= u_opacities[int(rand * 10.0)];
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
            opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

            vec3 color = u_colors[int(show_offset * 6.0)];

            float animation_speed_factor = 0.5;
            vec2 center_grid = u_resolution / 2.0 / u_total_size;
            float dist_from_center = distance(center_grid, st2);

            float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);

            float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
            float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

            float current_timing_offset;
            if (u_reverse == 1) {
                current_timing_offset = timing_offset_outro;
                 opacity *= 1.0 - step(current_timing_offset, u_time * animation_speed_factor);
                 opacity *= clamp((step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            } else {
                current_timing_offset = timing_offset_intro;
                 opacity *= step(current_timing_offset, u_time * animation_speed_factor);
                 opacity *= clamp((1.0 - step(current_timing_offset + 0.1, u_time * animation_speed_factor)) * 1.25, 1.0, 1.25);
            }

            fragColor = vec4(color, opacity);
            fragColor.rgb *= fragColor.a;
        }`}
      uniforms={uniforms}
      maxFps={60}
    />
  );
};

const ShaderMaterial = ({
  source,
  uniforms,
  maxFps = 60,
}: {
  source: string;
  hovered?: boolean;
  maxFps?: number;
  uniforms: Uniforms;
}) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const timestamp = clock.getElapsedTime();
    const material: any = ref.current.material;
    if (material && material.uniforms && material.uniforms.u_time) {
      material.uniforms.u_time.value = timestamp;
    }
  });

  const getUniforms = () => {
    const preparedUniforms: any = {};

    for (const uniformName in uniforms) {
      const uniform: any = uniforms[uniformName];

      switch (uniform.type) {
        case "uniform1f":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1f" };
          break;
        case "uniform1i":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1i" };
          break;
        case "uniform3f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector3().fromArray(uniform.value),
            type: "3f",
          };
          break;
        case "uniform1fv":
          preparedUniforms[uniformName] = { value: uniform.value, type: "1fv" };
          break;
        case "uniform3fv":
          preparedUniforms[uniformName] = {
            value: uniform.value.map((v: number[]) =>
              new THREE.Vector3().fromArray(v)
            ),
            type: "3fv",
          };
          break;
        case "uniform2f":
          preparedUniforms[uniformName] = {
            value: new THREE.Vector2().fromArray(uniform.value),
            type: "2f",
          };
          break;
        default:
          console.error(`Invalid uniform type for '${uniformName}'.`);
          break;
      }
    }

    preparedUniforms["u_time"] = { value: 0, type: "1f" };
    preparedUniforms["u_resolution"] = {
      value: new THREE.Vector2(size.width * 2, size.height * 2),
    };
    return preparedUniforms;
  };

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
      precision mediump float;
      in vec2 coordinates;
      uniform vec2 u_resolution;
      out vec2 fragCoord;
      void main(){
        float x = position.x;
        float y = position.y;
        gl_Position = vec4(x, y, 0.0, 1.0);
        fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
        fragCoord.y = u_resolution.y - fragCoord.y;
      }
      `,
      fragmentShader: source,
      uniforms: getUniforms(),
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
  }, [size.width, size.height, source]);

  return (
    <mesh ref={ref as any}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

const Shader: React.FC<ShaderProps> = ({ source, uniforms, maxFps = 60 }) => {
  return (
    <Canvas className="absolute inset-0 h-full w-full pointer-events-none">
      <ShaderMaterial source={source} uniforms={uniforms} maxFps={maxFps} />
    </Canvas>
  );
};

const AnimatedNavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const defaultTextColor = 'text-slate-400';
  const hoverTextColor = 'text-emerald-400';
  const textSizeClass = 'text-xs font-semibold';

  return (
    <Link to={href} className={`group relative inline-block overflow-hidden h-5 flex items-center ${textSizeClass}`}>
      <div className="flex flex-col transition-transform duration-300 ease-out transform group-hover:-translate-y-1/2">
        <span className={defaultTextColor}>{children}</span>
        <span className={hoverTextColor}>{children}</span>
      </div>
    </Link>
  );
};

export function MiniNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [headerShapeClass, setHeaderShapeClass] = useState('rounded-full');
  const shapeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    if (shapeTimeoutRef.current) {
      clearTimeout(shapeTimeoutRef.current);
    }

    if (isOpen) {
      setHeaderShapeClass('rounded-2xl');
    } else {
      shapeTimeoutRef.current = setTimeout(() => {
        setHeaderShapeClass('rounded-full');
      }, 300);
    }

    return () => {
      if (shapeTimeoutRef.current) {
        clearTimeout(shapeTimeoutRef.current);
      }
    };
  }, [isOpen]);

  const logoElement = (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-xs shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
        RR
      </div>
      <div className="hidden xs:block sm:block">
        <span className="font-extrabold text-sm text-slate-100 tracking-tight block leading-none">
          RevenueRescue <span className="text-emerald-400">AI</span>
        </span>
      </div>
    </Link>
  );

  const navLinksData = [
    { label: 'Command Center', href: '/recovery' },
    { label: 'Priority Queue', href: '/recovery/priority' },
    { label: 'Live Recovery', href: '/live-recovery' },
    { label: 'Simulator', href: '/calculator' },
  ];

  const loginButtonElement = (
    <Link to="/login" className="px-3.5 py-1.5 text-xs border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 font-semibold rounded-full hover:border-emerald-400 hover:text-white hover:bg-emerald-900/60 transition-all duration-200">
      Portal Sign In
    </Link>
  );

  const signupButtonElement = (
    <div className="relative group">
       <div className="absolute inset-0 -m-1.5 rounded-full
                     hidden sm:block
                     bg-emerald-500
                     opacity-30 filter blur-md pointer-events-none
                     transition-all duration-300 ease-out
                     group-hover:opacity-50 group-hover:blur-lg"></div>
       <Link to="/signup" className="relative z-10 px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full hover:from-emerald-300 hover:to-teal-200 transition-all duration-200 shadow-sm">
         Deploy Free
       </Link>
    </div>
  );

  return (
    <header className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-30
                       flex flex-col items-center
                       px-5 py-2.5 backdrop-blur-md
                       ${headerShapeClass}
                       border border-slate-800/80 bg-slate-950/80 shadow-2xl shadow-black/60
                       w-[calc(100%-2rem)] max-w-4xl
                       transition-[border-radius] duration-200 ease-in-out`}>

      <div className="flex items-center justify-between w-full gap-x-4 sm:gap-x-6">
        <div className="flex items-center">
           {logoElement}
        </div>

        <nav className="hidden md:flex items-center space-x-5 text-xs">
          {navLinksData.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-2">
          {loginButtonElement}
          {signupButtonElement}
        </div>

        <button className="sm:hidden flex items-center justify-center w-8 h-8 text-slate-400 focus:outline-none" onClick={toggleMenu} aria-label={isOpen ? 'Close Menu' : 'Open Menu'}>
          {isOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          )}
        </button>
      </div>

      <div className={`sm:hidden flex flex-col items-center w-full transition-all ease-in-out duration-300 overflow-hidden
                       ${isOpen ? 'max-h-[500px] opacity-100 pt-3' : 'max-h-0 opacity-0 pt-0 pointer-events-none'}`}>
        <nav className="flex flex-col items-center space-y-3 text-xs w-full py-2">
          {navLinksData.map((link) => (
            <Link key={link.href} to={link.href} className="text-slate-300 hover:text-emerald-400 transition-colors w-full text-center py-1">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-row items-center justify-center gap-2 pt-2 border-t border-slate-800 w-full">
          {loginButtonElement}
          {signupButtonElement}
        </div>
      </div>
    </header>
  );
}

export const SignInPage = ({ className, onSuccess }: SignInPageProps) => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code" | "success">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [initialCanvasVisible, setInitialCanvasVisible] = useState(true);
  const [reverseCanvasVisible, setReverseCanvasVisible] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setStep("code");
    }
  };

  useEffect(() => {
    if (step === "code") {
      setTimeout(() => {
        codeInputRefs.current[0]?.focus();
      }, 300);
    }
  }, [step]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);
      
      if (value && index < 5) {
        codeInputRefs.current[index + 1]?.focus();
      }
      
      if (index === 5 && value) {
        const isComplete = newCode.every((digit) => digit.length === 1);
        if (isComplete) {
          setReverseCanvasVisible(true);
          setTimeout(() => {
            setInitialCanvasVisible(false);
          }, 50);
          setTimeout(() => {
            setStep("success");
          }, 1500);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleBackClick = () => {
    setStep("email");
    setCode(["", "", "", "", "", ""]);
    setReverseCanvasVisible(false);
    setInitialCanvasVisible(true);
  };

  return (
    <div className={cn("flex w-full flex-col min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden", className)}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        {initialCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={3}
              containerClassName="bg-slate-950"
              colors={[
                [16, 185, 129],
                [20, 184, 166],
                [6, 182, 212]
              ]}
              dotSize={4}
              reverse={false}
            />
          </div>
        )}
        
        {reverseCanvasVisible && (
          <div className="absolute inset-0">
            <CanvasRevealEffect
              animationSpeed={4}
              containerClassName="bg-slate-950"
              colors={[
                [16, 185, 129],
                [52, 211, 153],
                [110, 231, 183]
              ]}
              dotSize={5}
              reverse={true}
            />
          </div>
        )}
        
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(11,15,25,0.4)_0%,_rgba(11,15,25,0.95)_100%)] pointer-events-none" />
      </div>
      
      <div className="relative z-10 flex flex-col flex-1">
        <MiniNavbar />

        <div className="flex flex-1 flex-col items-center justify-center p-4 pt-24 sm:pt-28">
          <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80">
            <AnimatePresence mode="wait">
              {step === "email" ? (
                <motion.div 
                  key="email-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[11px] font-mono text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      RevenueRescue AI Enterprise
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Welcome Back</h1>
                    <p className="text-xs sm:text-sm text-slate-400 font-light">Autonomous revenue recovery and financial intelligence portal</p>
                  </div>
                  
                  <div className="space-y-4">
                    <form onSubmit={handleEmailSubmit}>
                      <div className="relative">
                        <input 
                          type="email" 
                          placeholder="operator.aarav@revenuerescue.ai"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-950/90 text-white border border-slate-800 rounded-full py-3.5 pl-5 pr-12 focus:outline-none focus:border-emerald-500 text-xs sm:text-sm font-mono transition-colors"
                          required
                        />
                        <button 
                          type="submit"
                          className="absolute right-2 top-2 text-white w-9 h-9 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/30"
                        >
                          →
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  <p className="text-[11px] text-slate-500">
                    Protected by SOC-2 Type II standards & deterministic policy guardrails.
                  </p>
                </motion.div>
              ) : step === "code" ? (
                <motion.div 
                  key="code-step"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-2">
                    <h1 className="text-2xl font-black text-white tracking-tight">Security 2FA Code</h1>
                    <p className="text-xs text-slate-400">Enter the 6-digit recovery verification code sent to <span className="text-emerald-400 font-mono font-medium">{email || 'your email'}</span></p>
                  </div>
                  
                  <div className="w-full">
                    <div className="relative rounded-2xl py-3 px-4 border border-slate-800 bg-slate-950/80">
                      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                        {code.map((digit, i) => (
                          <div key={i} className="flex items-center">
                            <div className="relative">
                              <input
                                ref={(el) => {
                                  codeInputRefs.current[i] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleCodeChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                className="w-9 sm:w-10 h-10 text-center text-lg font-mono font-bold bg-slate-900 border border-slate-700/60 rounded-lg text-emerald-400 focus:outline-none focus:border-emerald-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex w-full gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={handleBackClick}
                      className="rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold px-5 py-3 hover:bg-slate-700 transition-colors"
                    >
                      Back
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setReverseCanvasVisible(true);
                        setTimeout(() => {
                          setInitialCanvasVisible(false);
                        }, 50);
                        setTimeout(() => {
                          setStep("success");
                        }, 1500);
                      }}
                      className={`flex-1 rounded-xl text-xs font-bold py-3 transition-all duration-300 ${
                        code.every((d) => d !== "") 
                        ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 cursor-pointer" 
                        : "bg-slate-800/60 text-slate-500 cursor-not-allowed"
                      }`}
                    >
                      Verify & Proceed
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="success-step"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 text-center"
                >
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Identity Verified</h1>
                    <p className="text-xs text-emerald-400 font-medium">Deterministic audit trail generated (SHA-256)</p>
                  </div>
                  
                  <div className="py-6">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={onSuccess || (() => window.location.href = '/recovery')}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs py-3.5 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    Enter Autonomous Command Center →
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
