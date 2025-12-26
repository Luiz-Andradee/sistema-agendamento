export function formatPrice(priceCents: number): string {
    return (priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase()
}
