import Image from "next/image";
import React from "react";

const Logo = () => {
  return (
    <Image
      src="/images/logo.png"
      alt="Aurvella Logo"
      width={100}
      height={100}
    />
  );
};

export default Logo;
