import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContadorDeCaracteres } from './ContadorDeCaracteres'

describe('ContadorDeCaracteres', () => {
  it('no se ve lejos del límite', () => {
    const { container } = render(<ContadorDeCaracteres id="c" longitud={107} limite={120} />)

    expect(container.textContent).toBe('')
  })

  it('aparece cerca del límite', () => {
    render(<ContadorDeCaracteres id="c" longitud={108} limite={120} />)

    expect(screen.getByText('108/120')).toBeTruthy()
  })

  it('no avisa de exceso justo en el límite', () => {
    const { container } = render(<ContadorDeCaracteres id="c" longitud={120} limite={120} />)

    expect(container.textContent).toBe('120/120')
  })

  it('dice cuánto sobra al pasarse', () => {
    const { container } = render(<ContadorDeCaracteres id="c" longitud={125} limite={120} />)

    expect(container.textContent).toContain('125/120')
    expect(container.textContent).toContain('Sobran 5 caracteres')
  })

  it('usa el singular si sobra un carácter', () => {
    const { container } = render(<ContadorDeCaracteres id="c" longitud={121} limite={120} />)

    expect(container.textContent).toContain('Sobra 1 carácter')
  })
})
