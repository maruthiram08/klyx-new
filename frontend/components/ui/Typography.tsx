import React from 'react';

type TypographyVariant = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body-lg' | 'body' | 'caption';
type TypographyWeight = 'normal' | 'medium' | 'semibold' | 'bold';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
    variant?: TypographyVariant;
    weight?: TypographyWeight;
    as?: React.ElementType;
    className?: string;
    children: React.ReactNode;
}

export const Typography: React.FC<TypographyProps> = ({
    variant = 'body',
    weight,
    as,
    className = '',
    children,
    ...props
}) => {
    const styles = {
        display: 'text-5xl md:text-7xl tracking-tight leading-[1.1]',
        h1: 'text-4xl md:text-5xl tracking-tight leading-tight',
        h2: 'text-3xl md:text-4xl tracking-tight leading-tight',
        h3: 'text-2xl md:text-3xl tracking-tight',
        h4: 'text-xl md:text-2xl tracking-tight',
        'body-lg': 'text-lg md:text-xl leading-relaxed',
        body: 'text-base leading-relaxed',
        caption: 'text-sm text-neutral-500',
    };

    const weights = {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold',
    };

    // Default Element Mapping
    const Component = as || (
        variant.startsWith('h') ? variant.substring(0, 2) :
            variant === 'display' ? 'h1' :
                variant === 'caption' ? 'span' : 'p'
    ) as React.ElementType;

    // Default Weight Mapping
    const defaultWeight = weight ? weights[weight] : (
        ['display', 'h1', 'h2', 'h3'].includes(variant) ? weights.medium : weights.normal
    );

    return (
        <Component className={`${styles[variant]} ${defaultWeight} ${className}`} {...props}>
            {children}
        </Component>
    );
};
