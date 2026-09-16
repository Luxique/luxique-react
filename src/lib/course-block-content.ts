type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord
  }

  if (typeof value === 'string' && value.trimStart().startsWith('{')) {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as UnknownRecord
        : null
    } catch {
      return null
    }
  }

  return null
}

function firstString(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === 'string')
}

/**
 * Older builder versions occasionally wrapped an already structured block in
 * another `content` property. Read both shapes so builder and lesson player
 * always use the same complete payload.
 */
export function extractStoredBlockContent(content: unknown) {
  const root = asRecord(content)
  const nested = asRecord(root?.content)
  const media = (root?.media ?? nested?.media) as UnknownRecord | null | undefined

  return {
    title: firstString(root?.title, nested?.title),
    subtitle: firstString(root?.subtitle, nested?.subtitle),
    showTitle: (root?.showTitle ?? nested?.showTitle) as boolean | undefined,
    showSubtitle: (root?.showSubtitle ?? nested?.showSubtitle) as boolean | undefined,
    showBody: (root?.showBody ?? nested?.showBody) as boolean | undefined,
    body: firstString(
      typeof root?.content === 'string' && !asRecord(root.content) ? root.content : undefined,
      nested?.content,
      typeof content === 'string' && !root ? content : undefined,
    ) || '',
    url: firstString(root?.url, nested?.url, media?.url),
    caption: firstString(root?.caption, nested?.caption, media?.caption),
    images: (root?.images ?? nested?.images) as Array<{ id: string; url: string; caption?: string }> | undefined,
    question: firstString(root?.question, nested?.question),
    media,
    optionType: firstString(root?.option_type, nested?.option_type),
    options: (root?.options ?? nested?.options) as unknown[] | undefined,
    fileName: firstString(root?.fileName, root?.file_name, nested?.fileName, nested?.file_name),
    fileDescription: firstString(root?.fileDescription, nested?.fileDescription),
    fileUrl: firstString(root?.fileUrl, root?.file_url, nested?.fileUrl, nested?.file_url),
    fileSize: (root?.fileSize ?? root?.file_size ?? nested?.fileSize ?? nested?.file_size) as number | undefined,
    muxAssetId: firstString(root?.mux_asset_id, nested?.mux_asset_id),
    muxPlaybackId: firstString(root?.mux_playback_id, nested?.mux_playback_id),
    muxPublicPlaybackId: firstString(root?.mux_public_playback_id, nested?.mux_public_playback_id),
  }
}

export function getBuilderVideoPlaybackConfig(content: unknown, isFree: boolean) {
  const stored = extractStoredBlockContent(content)

  return {
    playbackId: isFree
      ? stored.muxPublicPlaybackId || stored.muxPlaybackId
      : stored.muxPlaybackId,
    signed: !isFree,
  }
}

const ENCODED_RICH_TEXT_TAG = /&lt;\/?(?:p|strong|em|s|span|ul|ol|li|br)(?:\s|&gt;)/i

/** Decode HTML that a legacy save path escaped as text, but leave normal text alone. */
export function normalizeRichTextHtml(value: string | undefined): string {
  if (!value || !ENCODED_RICH_TEXT_TAG.test(value)) return value || ''

  return value
    .replace(/&lt;(\/?(?:p|strong|em|s|span|ul|ol|li|br)(?:\s[^&]*?)?)&gt;/gi, '<$1>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&amp;/gi, '&')
}
