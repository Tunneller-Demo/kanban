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

  it('con el límite de la nota, aparece a los 1800 caracteres', () => {
    const lejos = render(<ContadorDeCaracteres id="c" longitud={1799} limite={2000} />)
    expect(lejos.container.textContent).toBe('')
    lejos.unmount()

    render(<ContadorDeCaracteres id="c" longitud={1800} limite={2000} />)
    expect(screen.getByText('1800/2000')).toBeTruthy()
  })

  it('añade el aviso solo al pasarse', () => {
    const justo = render(
      <ContadorDeCaracteres id="c" longitud={2000} limite={2000} aviso="Sin guardar" />,
    )
    expect(justo.container.textContent).toBe('2000/2000')
    justo.unmount()

    const { container } = render(
      <ContadorDeCaracteres id="c" longitud={2005} limite={2000} aviso="Sin guardar" />,
    )
    expect(container.textContent).toBe('Sobran 5 caracteres. Sin guardar 2005/2000')
  })

  it('usa el singular si sobra un carácter', () => {
    const { container } = render(<ContadorDeCaracteres id="c" longitud={121} limite={120} />)

    expect(container.textContent).toContain('Sobra 1 carácter')
  })
})
