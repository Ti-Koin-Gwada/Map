// Carte topographique SVG de la Guadeloupe (placeholder crédible)
// Adapté du design Ti Koin Gwada — relief Basse-Terre + Grande-Terre

export const VB = { w: 1440, h: 900 }

const TK_BASSE  = "M 470 208 C 545 196 602 244 642 318 C 678 384 698 430 688 472 C 680 524 700 576 656 644 C 616 712 556 762 498 746 C 440 730 392 690 370 620 C 346 554 332 500 348 440 C 362 382 380 322 420 270 C 440 242 450 214 470 208 Z"
const TK_GRANDE = "M 762 300 C 770 248 822 232 884 238 C 962 246 1032 268 1082 320 C 1112 352 1122 392 1110 432 C 1100 482 1122 512 1080 562 C 1040 612 980 636 908 626 C 848 618 800 596 776 546 C 756 506 766 470 760 432 C 756 392 748 346 762 300 Z"

const ISLES = [
  "M 540 838 C 560 826 588 832 596 850 C 602 866 588 880 566 878 C 546 876 528 862 540 838 Z",
  "M 600 856 C 612 850 626 856 628 868 C 628 878 616 884 606 880 C 596 876 590 864 600 856 Z",
  "M 1066 742 C 1100 728 1142 748 1150 786 C 1156 820 1132 852 1096 850 C 1064 848 1040 818 1046 784 C 1050 762 1052 750 1066 742 Z",
  "M 1180 456 C 1224 450 1268 462 1276 476 C 1282 488 1250 494 1214 492 C 1188 490 1156 480 1156 472 C 1156 464 1166 458 1180 456 Z",
]

const RIVERS = [
  "M 512 540 C 488 590 452 640 392 666",
  "M 524 560 C 560 600 600 632 648 642",
  "M 470 430 C 430 470 392 510 372 560",
]

function Contours({ d, cx, cy, scales, color, opacity }) {
  return (
    <>
      {scales.map((s, i) => (
        <g key={i} transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
          <path d={d} fill="none" stroke={color}
            strokeOpacity={opacity * (1 - i * 0.06)} strokeWidth="1.4"
            vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </>
  )
}

export default function GuadeloupeSVG() {
  return (
    <svg
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <linearGradient id="tk-land-bt" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0"    stopColor="#A6C9A2" />
          <stop offset="0.55" stopColor="#8DB78C" />
          <stop offset="1"    stopColor="#7AA87E" />
        </linearGradient>
        <linearGradient id="tk-land-gt" x1="0" y1="0" x2="0.2" y2="1">
          <stop offset="0" stopColor="#BACDA1" />
          <stop offset="1" stopColor="#A6C291" />
        </linearGradient>
        <radialGradient id="tk-shade-bt" cx="0.38" cy="0.42" r="0.7">
          <stop offset="0"    stopColor="#1A2E20" stopOpacity="0" />
          <stop offset="0.78" stopColor="#1A2E20" stopOpacity="0" />
          <stop offset="1"    stopColor="#1A2E20" stopOpacity="0.16" />
        </radialGradient>
        <radialGradient id="tk-peak" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#5E8A63" stopOpacity="0.55" />
          <stop offset="1" stopColor="#5E8A63" stopOpacity="0" />
        </radialGradient>
        <clipPath id="tk-clip-bt"><path d={TK_BASSE} /></clipPath>
        <clipPath id="tk-clip-gt"><path d={TK_GRANDE} /></clipPath>
      </defs>

      {/* Mer / fond */}
      <rect width={VB.w} height={VB.h} fill="#D4EBF0" />

      {/* Bathymétrie */}
      <g opacity="0.5">
        <path d="M 300 200 C 520 120 1020 130 1230 250 C 1330 310 1320 640 1180 720 C 980 830 520 840 360 740 C 230 660 200 300 300 200 Z"
          fill="none" stroke="#BBDAD4" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <path d="M 360 250 C 560 180 1000 188 1180 296 C 1268 348 1258 612 1130 686 C 952 782 560 792 416 700 C 300 626 274 332 360 250 Z"
          fill="none" stroke="#BBDAD4" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </g>

      {/* Récif corallien */}
      <path d="M 790 600 C 880 656 980 666 1075 612" fill="none"
        stroke="#9FD4CA" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round"
        vectorEffect="non-scaling-stroke" opacity="0.8" />

      {/* BASSE-TERRE */}
      <path d={TK_BASSE} fill="none" stroke="#E7DEC6" strokeWidth="8" vectorEffect="non-scaling-stroke" />
      <path d={TK_BASSE} fill="url(#tk-land-bt)" />
      <ellipse cx="510" cy="540" rx="120" ry="150" fill="url(#tk-peak)" />
      <g clipPath="url(#tk-clip-bt)">
        <rect x="330" y="190" width="380" height="570" fill="url(#tk-shade-bt)" />
        <Contours d={TK_BASSE} cx={505} cy={540} color="#37623F"
          opacity={0.2} scales={[0.9, 0.78, 0.66, 0.55, 0.45, 0.36, 0.28, 0.2, 0.13]} />
        {RIVERS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#86BDC6" strokeWidth="1.6"
            strokeOpacity="0.7" vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      {/* GRANDE-TERRE */}
      <path d={TK_GRANDE} fill="none" stroke="#E7DEC6" strokeWidth="8" vectorEffect="non-scaling-stroke" />
      <path d={TK_GRANDE} fill="url(#tk-land-gt)" />
      <g clipPath="url(#tk-clip-gt)">
        <Contours d={TK_GRANDE} cx={920} cy={430} color="#5E8052"
          opacity={0.14} scales={[0.86, 0.7, 0.55, 0.4, 0.27]} />
        {[330, 370, 410, 450, 490].map((y, i) => (
          <path key={i} d={`M 770 ${y + 80} C 870 ${y + 60} 990 ${y + 70} 1100 ${y + 50}`}
            fill="none" stroke="#8AAE72" strokeWidth="1" strokeOpacity="0.35"
            vectorEffect="non-scaling-stroke" />
        ))}
      </g>

      {/* Petites îles */}
      {ISLES.map((d, i) => (
        <g key={i}>
          <path d={d} fill="none" stroke="#E7DEC6" strokeWidth="6" vectorEffect="non-scaling-stroke" />
          <path d={d} fill="#9DBE92" />
        </g>
      ))}

      {/* Route principale */}
      <path d="M 470 240 C 600 300 660 420 700 440 C 760 470 820 360 900 300 C 980 250 1050 320 1080 400 C 1100 470 1000 560 900 600 C 800 630 700 600 660 640 C 600 700 540 740 500 745"
        fill="none" stroke="#D8C9A6" strokeWidth="1.6" strokeOpacity="0.55"
        strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
