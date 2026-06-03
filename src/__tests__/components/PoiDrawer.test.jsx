import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PoiDrawer from '../../components/poi/PoiDrawer.jsx'

const BASE_POI = {
  id: 'poi-1',
  name: 'Plage du Gosier',
  category: 'plage',
  address: 'Le Gosier, Guadeloupe',
  description: 'Une belle plage de sable blanc.',
  tags: ['famille', 'baignade'],
  instagram_url: null,
  image_url: null,
}

describe('PoiDrawer', () => {
  it('renders nothing when poi is null', () => {
    const { container } = render(<PoiDrawer poi={null} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the POI name', () => {
    render(<PoiDrawer poi={BASE_POI} />)
    expect(screen.getByText('Plage du Gosier')).toBeInTheDocument()
  })

  it('renders the POI address', () => {
    render(<PoiDrawer poi={BASE_POI} />)
    expect(screen.getByText('Le Gosier, Guadeloupe')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<PoiDrawer poi={BASE_POI} />)
    expect(screen.getByText('Une belle plage de sable blanc.')).toBeInTheDocument()
  })

it('renders the custom note ("Note de Flo") when provided', () => {
    render(<PoiDrawer poi={BASE_POI} customNote="Vraiment incroyable !" />)
    expect(screen.getByText('Note de Flo')).toBeInTheDocument()
    expect(screen.getByText('Vraiment incroyable !')).toBeInTheDocument()
  })

  it('does not render "Note de Flo" when no customNote', () => {
    render(<PoiDrawer poi={BASE_POI} />)
    expect(screen.queryByText('Note de Flo')).not.toBeInTheDocument()
  })

  it('generates the correct Google Maps link', () => {
    render(<PoiDrawer poi={BASE_POI} />)
    const link = screen.getByRole('link', { name: /Y aller/i })
    expect(link).toHaveAttribute('href', expect.stringContaining('google.com/maps/search'))
    expect(link).toHaveAttribute('href', expect.stringContaining(encodeURIComponent('Plage du Gosier Guadeloupe')))
  })

  it('does not render an Instagram link when instagram_url is null', () => {
    render(<PoiDrawer poi={BASE_POI} />)
    expect(screen.queryByText(/Instagram/i)).not.toBeInTheDocument()
  })

  it('renders an Instagram link when instagram_url is a handle', () => {
    render(<PoiDrawer poi={{ ...BASE_POI, instagram_url: '@tikwingwada' }} />)
    const link = screen.getByRole('link', { name: /Instagram/i })
    expect(link).toHaveAttribute('href', 'https://www.instagram.com/tikwingwada')
  })

  it('uses the full URL when instagram_url starts with http', () => {
    render(<PoiDrawer poi={{ ...BASE_POI, instagram_url: 'https://instagram.com/tikwingwada' }} />)
    const link = screen.getByRole('link', { name: /Instagram/i })
    expect(link).toHaveAttribute('href', 'https://instagram.com/tikwingwada')
  })

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn()
    render(<PoiDrawer poi={BASE_POI} onClose={onClose} />)
    const closeBtn = screen.getByRole('button')
    await userEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders an image when image_url is provided', () => {
    render(<PoiDrawer poi={{ ...BASE_POI, image_url: 'https://example.com/photo.jpg' }} />)
    const img = screen.getByRole('img', { name: 'Plage du Gosier' })
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })
})
