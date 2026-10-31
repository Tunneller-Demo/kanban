import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom no tiene diseño, así que tampoco esta función. Las pruebas del Modelo corren sin DOM.
if (typeof Element !== 'undefined') Element.prototype.scrollIntoView = () => {}

afterEach(cleanup)
