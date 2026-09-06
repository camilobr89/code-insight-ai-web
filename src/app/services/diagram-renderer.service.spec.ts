import { TestBed } from '@angular/core/testing';
import { DiagramRendererService } from './diagram-renderer.service';

const { initializeMock, renderMock } = vi.hoisted(() => ({
  initializeMock: vi.fn(),
  renderMock: vi.fn(),
}));

vi.mock('mermaid', () => ({
  default: {
    initialize: initializeMock,
    render: renderMock,
  },
}));

describe('DiagramRendererService', () => {
  let service: DiagramRendererService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DiagramRendererService);
    renderMock.mockReset();
    initializeMock.mockReset();
  });

  it('returns null for an empty or missing definition', async () => {
    expect(await service.render('')).toBeNull();
    expect(await service.render('   ')).toBeNull();
    expect(renderMock).not.toHaveBeenCalled();
  });

  it('renders a definition into sanitized SVG', async () => {
    renderMock.mockResolvedValue({ svg: '<svg><text>ok</text></svg>' });

    const result = await service.render('flowchart TD\n  A --> B');

    expect(renderMock).toHaveBeenCalledWith(expect.stringContaining('analysis-diagram-'), 'flowchart TD\n  A --> B');
    expect(result).not.toBeNull();
  });

  it('returns null when mermaid fails to render', async () => {
    renderMock.mockRejectedValue(new Error('invalid diagram'));

    const result = await service.render('not a real diagram');

    expect(result).toBeNull();
  });
});
