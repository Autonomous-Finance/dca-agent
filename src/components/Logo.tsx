import React, { SVGProps } from "react"

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="250"
      viewBox="0 0 195 14"
      fill={props.mode === "dark" ? "#FFF" : "none"}
      {...props}
    >
      <path
        d="M14.2808 6.97425L20.0172 13.8772C20.0819 13.9552 20.1762 14 20.2753 14H27.7542C28.0357 14 28.1961 13.6655 28.0265 13.4319L21.3599 4.25C17.5864 4.24791 16.2092 5.0278 14.2808 6.97425Z"
        fill="url(#paint0_linear_2001_94)"
      />
      <path
        d="M21.4282 3.59629C18.0158 -1.10355 11.2239 -1.10355 7.81151 3.59629L0.874136 13.1511C0.704531 13.3846 0.864881 13.7192 1.14647 13.7192H9.48443C9.59302 13.7192 9.69517 13.6654 9.75944 13.5744L14.6199 6.69344C16.5483 4.747 17.9255 3.96711 21.699 3.9692L21.4282 3.59629Z"
        fill="url(#paint1_linear_2001_94)"
      />
      <path
        d="M43.1234 13.0521L42.0604 10.0269H36.9906L35.9112 13.0521H34.0959L38.5933 0.849243H40.5722L45.0368 13.0521H43.1234ZM39.5418 2.88874L37.5303 8.51427H41.5207L39.5418 2.88874Z"
        fill={props.color}
      />
      <path
        d="M51.618 9.34717V4.04456H53.2698V13.0522H51.7325V11.6246C51.2746 12.5593 50.2606 13.2222 49.0831 13.2222C47.3332 13.2222 46.123 12.1514 46.123 9.84004V4.04456H47.7748V9.50013C47.7748 11.0637 48.5271 11.7096 49.6065 11.7096C50.7185 11.7096 51.618 10.7578 51.618 9.34717Z"
        fill={props.color}
      />
      <path
        d="M60.4536 11.3865V12.8991C59.9466 13.137 59.505 13.222 58.9817 13.222C57.379 13.222 56.2669 12.3212 56.2669 10.3328V5.50602H54.3535V4.0444H56.2669V1.3761H57.9187V4.0444H60.5354V5.50602H57.9187V9.94186C57.9187 11.1825 58.4911 11.6244 59.3742 11.6244C59.7667 11.6244 60.1101 11.5564 60.4536 11.3865Z"
        fill={props.color}
      />
      <path
        d="M65.503 13.2221C63.0499 13.2221 61.251 11.2166 61.251 8.54829C61.251 5.87999 63.0499 3.87451 65.503 3.87451C67.9561 3.87451 69.7551 5.87999 69.7551 8.54829C69.7551 11.2166 67.9561 13.2221 65.503 13.2221ZM65.503 11.7095C66.9258 11.7095 68.0543 10.5198 68.0543 8.54829C68.0543 6.57681 66.9258 5.40411 65.503 5.40411C64.0802 5.40411 62.9682 6.57681 62.9682 8.54829C62.9682 10.5198 64.0802 11.7095 65.503 11.7095Z"
        fill={props.color}
      />
      <path
        d="M73.0905 7.97044V13.0521H71.4387V4.04447H72.976V5.54008C73.5647 4.53734 74.546 3.87451 75.7398 3.87451C77.5224 3.87451 78.6999 5.0642 78.6999 7.22264V13.0521H77.0482V7.80049C77.0482 6.25389 76.394 5.38712 75.1674 5.38712C74.039 5.38712 73.0905 6.37286 73.0905 7.97044Z"
        fill={props.color}
      />
      <path
        d="M84.524 13.2221C82.0709 13.2221 80.272 11.2166 80.272 8.54829C80.272 5.87999 82.0709 3.87451 84.524 3.87451C86.9771 3.87451 88.7761 5.87999 88.7761 8.54829C88.7761 11.2166 86.9771 13.2221 84.524 13.2221ZM84.524 11.7095C85.9468 11.7095 87.0753 10.5198 87.0753 8.54829C87.0753 6.57681 85.9468 5.40411 84.524 5.40411C83.1012 5.40411 81.9891 6.57681 81.9891 8.54829C81.9891 10.5198 83.1012 11.7095 84.524 11.7095Z"
        fill={props.color}
      />
      <path
        d="M92.1117 13.0521H90.46V4.04447H91.9972V5.54008C92.586 4.50335 93.5182 3.87451 94.712 3.87451C95.9876 3.87451 96.9525 4.55433 97.345 5.74402C97.9501 4.58833 98.9477 3.87451 100.272 3.87451C102.055 3.87451 103.2 5.0812 103.2 7.22264V13.0521H101.548V7.7665C101.548 6.27089 100.91 5.38712 99.7 5.38712C98.5716 5.38712 97.6557 6.37286 97.6557 7.88546V13.0521H96.004V7.7665C96.004 6.27089 95.3662 5.38712 94.156 5.38712C93.0112 5.38712 92.1117 6.37286 92.1117 7.88546V13.0521Z"
        fill={props.color}
      />
      <path
        d="M109.039 13.2221C106.586 13.2221 104.787 11.2166 104.787 8.54829C104.787 5.87999 106.586 3.87451 109.039 3.87451C111.492 3.87451 113.291 5.87999 113.291 8.54829C113.291 11.2166 111.492 13.2221 109.039 13.2221ZM109.039 11.7095C110.462 11.7095 111.59 10.5198 111.59 8.54829C111.59 6.57681 110.462 5.40411 109.039 5.40411C107.616 5.40411 106.504 6.57681 106.504 8.54829C106.504 10.5198 107.616 11.7095 109.039 11.7095Z"
        fill={props.color}
      />
      <path
        d="M120.388 9.34717V4.04456H122.04V13.0522H120.503V11.6246C120.045 12.5593 119.031 13.2222 117.853 13.2222C116.103 13.2222 114.893 12.1514 114.893 9.84004V4.04456H116.545V9.50013C116.545 11.0637 117.297 11.7096 118.376 11.7096C119.489 11.7096 120.388 10.7578 120.388 9.34717Z"
        fill={props.color}
      />
      <path
        d="M131.203 10.3668C131.203 12.1344 129.878 13.2221 127.572 13.2221C125.282 13.2221 123.925 12.0494 123.761 10.1119H125.348C125.413 11.2336 126.28 11.9304 127.605 11.9304C128.766 11.9304 129.534 11.5055 129.534 10.6557C129.534 9.90794 129.093 9.58502 128.014 9.36408L126.607 9.09215C125.004 8.76923 124.105 7.91945 124.105 6.55981C124.105 4.97922 125.43 3.87451 127.441 3.87451C129.518 3.87451 130.925 5.03021 131.072 6.88273H129.485C129.387 5.79501 128.619 5.16617 127.457 5.16617C126.411 5.16617 125.708 5.62505 125.708 6.40685C125.708 7.13766 126.149 7.47757 127.196 7.68152L128.668 7.97044C130.385 8.29336 131.203 9.07515 131.203 10.3668Z"
        fill={props.color}
      />
      <path
        d="M139.002 13.0606H137.203V0.857788H144.333V2.4894H139.002V6.46636H143.548V8.09793H139.002V13.0606Z"
        fill={props.color}
      />
      <path
        d="M147.979 1.96252C147.979 2.60839 147.488 3.10126 146.785 3.10126C146.082 3.10126 145.575 2.60839 145.575 1.96252C145.575 1.29973 146.082 0.823853 146.785 0.823853C147.488 0.823853 147.979 1.29973 147.979 1.96252ZM147.619 13.0607H145.967V4.05301H147.619V13.0607Z"
        fill={props.color}
      />
      <path
        d="M151.564 7.97899V13.0607H149.912V4.05301H151.449V5.54862C152.038 4.54588 153.019 3.88306 154.213 3.88306C155.996 3.88306 157.173 5.07275 157.173 7.23118V13.0607H155.522V7.80903C155.522 6.26243 154.867 5.39566 153.641 5.39566C152.512 5.39566 151.564 6.3814 151.564 7.97899Z"
        fill={props.color}
      />
      <path
        d="M164.617 13.0607V11.667C164.077 12.6698 163.112 13.2306 161.837 13.2306C160.038 13.2306 158.86 12.1599 158.86 10.5113C158.86 8.74379 160.217 7.82603 162.801 7.82603C163.308 7.82603 163.717 7.84302 164.42 7.928V7.26517C164.42 5.97351 163.75 5.2427 162.605 5.2427C161.395 5.2427 160.659 5.99051 160.61 7.24818H159.105C159.187 5.22571 160.577 3.88306 162.605 3.88306C164.748 3.88306 165.99 5.14073 165.99 7.28217V13.0607H164.617ZM160.43 10.4603C160.43 11.3951 161.101 12.0069 162.164 12.0069C163.554 12.0069 164.42 11.1062 164.42 9.72953V8.99872C163.783 8.91374 163.325 8.89675 162.9 8.89675C161.248 8.89675 160.43 9.40661 160.43 10.4603Z"
        fill={props.color}
      />
      <path
        d="M169.85 7.97899V13.0607H168.199V4.05301H169.736V5.54862C170.325 4.54588 171.306 3.88306 172.5 3.88306C174.282 3.88306 175.46 5.07275 175.46 7.23118V13.0607H173.808V7.80903C173.808 6.26243 173.154 5.39566 171.927 5.39566C170.799 5.39566 169.85 6.3814 169.85 7.97899Z"
        fill={props.color}
      />
      <path
        d="M181.071 13.2476C178.7 13.2476 177.032 11.3101 177.032 8.55684C177.032 5.83755 178.733 3.88306 181.071 3.88306C183.214 3.88306 184.767 5.36167 185.078 7.70706H183.345C183.165 6.26244 182.298 5.39566 181.088 5.39566C179.665 5.39566 178.733 6.65333 178.733 8.55684C178.733 10.4773 179.665 11.718 181.088 11.718C182.314 11.718 183.165 10.8682 183.361 9.40661H185.078C184.784 11.786 183.247 13.2476 181.071 13.2476Z"
        fill={props.color}
      />
      <path
        d="M190.226 13.2306C187.724 13.2306 186.04 11.3441 186.04 8.50585C186.04 5.83755 187.789 3.88306 190.177 3.88306C192.761 3.88306 194.478 6.05845 194.184 8.98172H187.724C187.855 10.8172 188.738 11.888 190.193 11.888C191.42 11.888 192.27 11.1911 192.548 10.0185H194.184C193.759 12.0239 192.27 13.2306 190.226 13.2306ZM190.144 5.17472C188.82 5.17472 187.92 6.16046 187.74 7.84302H192.434C192.352 6.17746 191.485 5.17472 190.144 5.17472Z"
        fill={props.color}
      />
      <defs>
        <linearGradient
          id="paint0_linear_2001_94"
          x1="17.6924"
          y1="5.49091"
          x2="30.9729"
          y2="20.0498"
          gradientUnits="userSpaceOnUse"
        >
          <stop />
          <stop offset="1" stopColor={props.mode === "dark" ? "#AAAAAA": "#666666"} />
        </linearGradient>
        <linearGradient
          id="paint1_linear_2001_94"
          x1="1.65573"
          y1="13.7192"
          x2="13.2728"
          y2="-0.586789"
          gradientUnits="userSpaceOnUse"
        >
          <stop />
          <stop offset="1" stopColor={props.mode === "dark" ? "#D2D2D2" : "#9C9C9C" }/>
        </linearGradient>
      </defs>
    </svg>
  )
}