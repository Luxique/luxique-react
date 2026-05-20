'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MuxPlayer from '@mux/mux-player-react'
import { TextBlock, ImageBlock, QuizBlock, CalloutBlock, DownloadBlock } from './BlockComponents'
import RichTextField from './RichTextField'

/* ── SortableBlock (module-level, prevents re-mount) ── */
function SortableBlock({ block, children }: { block: { id: string }, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  
  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 10 : undefined,
      position: 'relative',
    }}>
      {/* Drag handle */}
      <div {...attributes} {...listeners} style={{
        position: 'absolute',
        top: 8,
        left: -24,
        width: 20,
        height: 20,
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.3,
        transition: 'opacity 0.15s',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
      {children}
    </div>
  );
}

/* ── Types ── */
type BlockType = 'video' | 'text' | 'image' | 'quiz' | 'callout' | 'download' | 'divider'

interface Block {
  id: string
  type: BlockType
  title?: string
  subtitle?: string
  content?: string | {
    mux_asset_id?: string
    mux_playback_id?: string
    [key: string]: unknown
  }
  url?: string
  caption?: string
  question?: string
  options?: Array<{ id: string; text: string; correct: boolean }>
  points?: number
  quizType?: 'intermediate' | 'final'
  autoplay?: boolean
  subtitles?: boolean
  fileName?: string
  fileDescription?: string
}

interface Lesson {
  id: string
  num: number
  name: string
  free: boolean
  duration?: number // Store as total minutes
  reflectionQuestions?: string[]
  blocks?: Block[]
}

interface Quiz {
  id: string
  num: number
  name: string
  type: 'intermediate' | 'final'
  minPassingScore?: number
  allowRetake?: boolean
  showAnswers?: boolean
  randomize?: boolean
  blocks?: Block[]
}

interface Course {
  id: string
  title: string
  description?: string
  longDescription?: string
  heroImageUrl?: string
  heroMuxPlaybackId?: string
  heroMuxAssetId?: string
  whatYouLearn?: string[]
  whoIsItFor?: string
  priceCents?: number
  level?: string
  galleryUrls?: string[]
  firstLessonFree?: boolean
  introVideo?: boolean
  finalQuizRequired?: boolean
  certificate?: boolean
  lessons?: Lesson[]
  quizzes?: Quiz[]
}

type ContextType = 'global' | 'lesson' | 'quiz'

function uid() { return crypto.randomUUID() }

/* ── Main Course Builder Component ── */
export default function CourseBuilderPage({ params }: { params: { id: string } }) {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [currentContext, setCurrentContext] = useState<ContextType>('global')
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [lessonNumber, setLessonNumber] = useState(2)
  const [blockPickerPosition, setBlockPickerPosition] = useState({ top: 0, left: 0 })
  const [pickerOpen, setPickerOpen] = useState(false)
  const addBlockButtonRef = useRef<HTMLButtonElement>(null)

  const [questionNumber, setQuestionNumber] = useState(1)
  
  // Video upload state
  const videoFileInputRef = useRef<HTMLInputElement>(null)
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoUploadProgress, setVideoUploadProgress] = useState(0)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    setBlocks(prev => {
      const oldIndex = prev.findIndex(b => b.id === active.id);
      const newIndex = prev.findIndex(b => b.id === over.id);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      // Persist order to Supabase
      reordered.forEach((block, index) => {
        supabase.from('blocks').update({ order: index }).eq('id', block.id).then(() => {});
      });
      return reordered;
    });
  };

  const toSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const saveCourse = useCallback(async () => {
    if (!course) return

    // Sync current blocks to course state first
    let courseToSave = course
    if (currentLesson) {
      courseToSave = {
        ...course,
        lessons: course.lessons?.map(l => l.id === currentLesson.id ? { ...l, blocks } : l)
      }
    }

    console.log('[saveCourse] Starting save...', {
      courseId: courseToSave.id,
      title: courseToSave.title,
      lessonCount: courseToSave.lessons?.length,
      currentContext,
      currentLessonId: currentLesson?.id,
      blocksCount: blocks.length,
      firstLessonBlocks: courseToSave.lessons?.[0]?.blocks?.length,
    })

    // 1. Upsert course (including landing fields)
    const { error: courseError } = await supabase.from('courses').upsert({
      id: courseToSave.id,
      title: courseToSave.title,
      slug: toSlug(courseToSave.title || 'nieuwe-cursus'),
      description: courseToSave.description || null,
      long_description: courseToSave.longDescription || null,
      hero_image_url: courseToSave.heroImageUrl || null,
      hero_mux_playback_id: courseToSave.heroMuxPlaybackId || null,
      hero_mux_asset_id: courseToSave.heroMuxAssetId || null,
      what_you_learn: courseToSave.whatYouLearn || [],
      who_is_it_for: courseToSave.whoIsItFor || null,
      price_cents: courseToSave.priceCents || 0,
      level: courseToSave.level || 'beginner',
      gallery_urls: courseToSave.galleryUrls || [],
      is_first_lesson_free: courseToSave.firstLessonFree || false,
      intro_video: courseToSave.introVideo || false,
      final_quiz_required: courseToSave.finalQuizRequired || false,
      certificate: courseToSave.certificate || false,
      status: 'draft'
    })
    if (courseError) {
      console.error('[saveCourse] Course upsert FAILED:', courseError)
      alert(`Fout bij opslaan cursus: ${courseError.message}`)
      return
    }
    console.log('[saveCourse] Course upsert OK')

    // 2. Sla ALLE lessen op
    for (const lesson of (courseToSave.lessons || [])) {
      const { error: lessonError } = await supabase.from('lessons').upsert({
        id: lesson.id,
        course_id: courseToSave.id,
        title: lesson.name,
        slug: toSlug(lesson.name || 'les'),
        is_free: lesson.free,
        sort_order: lesson.num - 1,
        duration_seconds: (lesson.duration || 0) * 60,
      })
      if (lessonError) {
        console.error(`[saveCourse] Lesson "${lesson.name}" upsert FAILED:`, lessonError)
        alert(`Fout bij opslaan les "${lesson.name}": ${lessonError.message}`)
        return
      }
      console.log(`[saveCourse] Lesson "${lesson.name}" upsert OK`)

      // 3. Sla blokken op voor deze les
      const lessonBlocks = lesson.blocks || []
      console.log(`[saveCourse] Saving ${lessonBlocks.length} blocks for lesson "${lesson.name}"`)
      for (let i = 0; i < lessonBlocks.length; i++) {
        const block = lessonBlocks[i]
        const blockContent = typeof block.content === 'object' && block.content !== null ? block.content : {}
        const payload = {
          id: block.id,
          lesson_id: lesson.id,
          course_id: courseToSave.id,
          type: block.type,
          sort_order: i,
          content: {
            title: block.title,
            subtitle: block.subtitle,
            content: block.content,
            url: block.url,
            caption: block.caption,
            question: block.question,
            options: block.options,
            fileName: block.fileName,
            fileDescription: block.fileDescription,
            mux_asset_id: (blockContent as Record<string,unknown>).mux_asset_id,
            mux_playback_id: (blockContent as Record<string,unknown>).mux_playback_id,
          }
        }
        const { error: blockError } = await supabase.from('blocks').upsert(payload)
        if (blockError) {
          console.error(`[saveCourse] Block ${i} (${block.type}) upsert FAILED:`, blockError)
          alert(`Fout bij opslaan blok ${i+1}: ${blockError.message}`)
          return
        }
      }
    }

    console.log('[saveCourse] ✅ Save complete!')
    alert('Concept opgeslagen!')
  }, [course, currentLesson, blocks])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const publishCourse = async () => {
    if (!course) return
    await saveCourse()
    const { error } = await supabase
      .from('courses')
      .update({ status: 'published' })
      .eq('id', course.id)
    if (error) { alert('Fout bij publiceren'); return }
    alert('Cursus gepubliceerd! Zichtbaar op de academy pagina.')
  }

  // Design tokens from mockup
  const colors = {
    gold: '#C4A265',
    goldL: '#DFC08A',
    goldD: '#7A6340',
    cream: '#FAF8F4',
    cream2: '#F0EDE6',
    cream3: '#E8E3DB',
    dark: '#0C0A07',
    dark2: '#161310',
    text: '#1E1A14',
    muted: '#7A7268',
    green: 'rgba(80,190,120,0.9)'
  }

  useEffect(() => { 
    if (!loading && !user) router.push('/login') 
  }, [user, loading, router])

  useEffect(() => {
    const courseId = params.id
    if (courseId && courseId !== 'new') {
      loadCourse(courseId)
    } else {
      setCourse({
        id: crypto.randomUUID(),
        title: 'Nieuwe Cursus',
        firstLessonFree: true,
        introVideo: true,
        finalQuizRequired: false,
        certificate: true,
        lessons: [
          { id: crypto.randomUUID(), num: 1, name: 'Introductie', free: true, reflectionQuestions: [], blocks: [
            { id: crypto.randomUUID(), type: 'video' as const },
            { id: crypto.randomUUID(), type: 'text' as const, title: '', subtitle: '', content: '' },
          ]}
        ],
        quizzes: [
          { id: crypto.randomUUID(), num: 1, name: 'Toets', type: 'intermediate' as const, blocks: [
            { id: crypto.randomUUID(), type: 'quiz' as const, question: '', options: [
              { id: crypto.randomUUID(), text: '', correct: true },
              { id: crypto.randomUUID(), text: '', correct: false },
            ]}
          ]}
        ]
      })
    }
  }, [params.id])

  useEffect(() => {
    const handleSave = () => { saveCourse() }
    window.addEventListener('builder-save', handleSave)
    return () => window.removeEventListener('builder-save', handleSave)
  }, [saveCourse])

  const loadCourse = async (id: string) => {
    const { data: courseData } = await supabase.from('courses').select('*').eq('id', id).single()
    if (courseData) {
      // Parse the course data
      const parsedCourse: Course = {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description || undefined,
        longDescription: courseData.long_description || undefined,
        heroImageUrl: courseData.hero_image_url || undefined,
        heroMuxPlaybackId: courseData.hero_mux_playback_id || undefined,
        heroMuxAssetId: courseData.hero_mux_asset_id || undefined,
        whatYouLearn: courseData.what_you_learn || [],
        whoIsItFor: courseData.who_is_it_for || undefined,
        priceCents: courseData.price_cents || 0,
        level: courseData.level || 'beginner',
        galleryUrls: courseData.gallery_urls || [],
        firstLessonFree: courseData.first_lesson_free || false,
        introVideo: courseData.intro_video || false,
        finalQuizRequired: courseData.final_quiz_required || false,
        certificate: courseData.certificate || false,
        lessons: [],
        quizzes: []
      }
      
      // Fetch lessons for this course
      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('sort_order')
        
      if (lessonsData) {
        parsedCourse.lessons = lessonsData.map(lesson => ({
          id: lesson.id,
          num: lesson.sort_order + 1,
          name: lesson.title,
          free: lesson.is_free,
          duration: lesson.duration_seconds ? Math.floor(lesson.duration_seconds / 60) : undefined,
          reflectionQuestions: [],
          blocks: [] // Will be loaded separately
        }))
      }
      
      setCourse(parsedCourse)
    }
  }

  // Auto-create lesson 1 if no lessons exist
  useEffect(() => {
    if (!course) return
    if (course.lessons && course.lessons.length > 0) return
    const firstLesson: Lesson = {
      id: crypto.randomUUID(),
      num: 1,
      name: 'Introductie',
      free: true,
      reflectionQuestions: [],
      blocks: [
        { id: crypto.randomUUID(), type: 'video' as const },
        { id: crypto.randomUUID(), type: 'text' as const, title: '', subtitle: '', content: '' },
      ]
    }
    setCourse({ ...course, lessons: [firstLesson] })
  }, [course?.id, course?.lessons?.length])

  const switchContext = async (type: ContextType, item?: Lesson | Quiz) => {
    setCurrentContext(type)
    if (type === 'lesson' && item && 'free' in item) {
      setCurrentLesson(item as Lesson)
      // Load blocks for this lesson
      await loadBlocksForLesson((item as Lesson).id)
    } else if (type === 'quiz' && item && 'type' in item) {
      setCurrentQuiz(item as Quiz)
      setBlocks((item as Quiz).blocks || [])
    } else {
      setBlocks([])
    }
  }

  const loadBlocksForLesson = async (lessonId: string) => {
    // Check lokale state eerst (voor nieuwe cursussen)
    const localLesson = course?.lessons?.find(l => l.id === lessonId)
    if (localLesson?.blocks && localLesson.blocks.length > 0) {
      setBlocks(localLesson.blocks)
      return
    }
    // Dan Supabase (voor bestaande cursussen)
    const { data } = await supabase
      .from('blocks')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('sort_order')
    if (data && data.length > 0) {
      setBlocks(data.map(b => ({
        id: b.id,
        type: b.type as BlockType,
        title: b.content?.title,
        subtitle: b.content?.subtitle,
        content: b.content?.content,
        url: b.content?.url,
        question: b.content?.question,
        options: b.content?.options,
      })))
    } else {
      // Geen blokken: zet standaard blokken
      setBlocks([
        { id: crypto.randomUUID(), type: 'video' as const },
        { id: crypto.randomUUID(), type: 'text' as const, title: '', subtitle: '', content: '' },
      ])
    }
  }

  const addBlock = (type: BlockType) => {
    const newBlock: Block = { id: uid(), type }
    setBlocks([...blocks, newBlock])
    setPickerOpen(false)
  }

  const openPicker = () => {
    if (!addBlockButtonRef.current) return
    const rect = addBlockButtonRef.current.getBoundingClientRect()
    const pickerHeight = 200
    const pickerWidth = 340
    const openUpward = rect.bottom + pickerHeight > window.innerHeight
    
    setBlockPickerPosition({
      top: openUpward ? rect.top - pickerHeight - 8 : rect.bottom + 8,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - pickerWidth - 8)),
    })
    setPickerOpen(true)
  }

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id))
  }

  const updateBlock = useCallback((blockId: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...updates } : b))
  }, [])

  const addLesson = () => {
    if (!course) return
    const defaultBlocks: Block[] = [
      { id: uid(), type: 'text', title: '', subtitle: '', content: '' },
      { id: uid(), type: 'video', autoplay: false, subtitles: false },
      { id: uid(), type: 'text', title: '', subtitle: '', content: '' }
    ]
    
    const newLesson: Lesson = {
      id: uid(),
      num: lessonNumber,
      name: `Les ${lessonNumber}`,
      free: false,
      reflectionQuestions: [],
      blocks: defaultBlocks
    }
    setLessonNumber(lessonNumber + 1)
    setCourse({
      ...course,
      lessons: [...(course.lessons || []), newLesson]
    })
  }

  const addReflectionQuestion = () => {
    if (!currentLesson) return
    const newQuestions = [...(currentLesson.reflectionQuestions || []), `Reflectievraag ${questionNumber}`]
    setQuestionNumber(questionNumber + 1)
    setCurrentLesson({
      ...currentLesson,
      reflectionQuestions: newQuestions
    })
  }

  const updateCourseField = (field: keyof Course, value: string | boolean | number | string[] | Lesson[] | Quiz[] | undefined) => {
    if (!course) return
    setCourse({ ...course, [field]: value })
  }

  const updateLessonField = (field: keyof Lesson, value: string | number | boolean | string[] | undefined) => {
    if (!currentLesson) return
    setCurrentLesson({ ...currentLesson, [field]: value })
  }

  const updateQuizField = (field: keyof Quiz, value: string | 'intermediate' | 'final' | number | boolean | undefined) => {
    if (!currentQuiz) return
    setCurrentQuiz({ ...currentQuiz, [field]: value })
  }

  const renderSidebarForm = () => {
    if (currentContext === 'global') {
      return (
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Cursustitel</label>
            <input
              type="text"
              value={course?.title || ''}
              onChange={(e) => updateCourseField('title', e.target.value)}
              className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[14px] font-['Cormorant_Garamond'] font-medium outline-none focus:border-[rgba(196,162,101,0.45)]"
              placeholder="bijv. Medusa Lash Basics"
            />
          </div>

          {/* Short description */}
          <div>
            <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Korte beschrijving (tagline)</label>
            <textarea
              value={course?.description || ''}
              onChange={(e) => updateCourseField('description', e.target.value)}
              className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)] min-h-[80px] resize-y"
              rows={3}
              placeholder="Wat leren studenten in deze cursus?"
            />
          </div>

          {/* Long description */}
          <div>
            <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Uitgebreide beschrijving</label>
            <RichTextField
              content={course?.longDescription || ''}
              onChange={(html) => updateCourseField('longDescription', html)}
              variant="block"
            />
          </div>

          {/* Price + Level */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Prijs (€)</label>
              <input
                type="text"
                value={course?.priceCents ? (course.priceCents / 100).toFixed(2).replace('.', ',') : '0,00'}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')
                  const euros = parseFloat(raw) || 0
                  updateCourseField('priceCents', Math.round(euros * 100))
                }}
                className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)]"
                placeholder="197,00"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Niveau</label>
              <select
                value={course?.level || 'beginner'}
                onChange={(e) => updateCourseField('level', e.target.value)}
                className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none cursor-pointer"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Gevorderd</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          {/* What you learn */}
          <div>
            <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Wat leer je?</label>
            {(course?.whatYouLearn || []).map((item, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const updated = [...(course?.whatYouLearn || [])]
                    updated[i] = e.target.value
                    updateCourseField('whatYouLearn', updated)
                  }}
                  className="flex-1 bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[6px_10px] text-[12px] outline-none"
                />
                <button
                  onClick={() => {
                    const updated = (course?.whatYouLearn || []).filter((_, j) => j !== i)
                    updateCourseField('whatYouLearn', updated)
                  }}
                  className="text-[rgba(30,26,20,0.25)] hover:text-[rgba(200,60,60,0.6)] p-1"
                >✕</button>
              </div>
            ))}
            <button
              onClick={() => updateCourseField('whatYouLearn', [...(course?.whatYouLearn || []), ''])}
              className="text-[11px] text-[#C4A265] hover:text-[#7A6340] transition mt-1"
            >+ Item toevoegen</button>
          </div>

          {/* Who is it for */}
          <div>
            <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Voor wie is deze cursus?</label>
            <textarea
              value={course?.whoIsItFor || ''}
              onChange={(e) => updateCourseField('whoIsItFor', e.target.value)}
              className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)] min-h-[50px]"
              placeholder="Beschrijf de ideale student..."
            />
          </div>

          {/* Access toggles */}
          <div className="border-t border-[rgba(30,26,20,0.09)] pt-3">
            <span className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#7A7268] block mb-2">Instellingen</span>
            {(
              [
                { label: 'Eerste les gratis preview', field: 'firstLessonFree' as keyof Course },
                { label: 'Intro video op cursuspagina', field: 'introVideo' as keyof Course },
                { label: 'Eindtoets verplicht', field: 'finalQuizRequired' as keyof Course },
                { label: 'Certificaat bij afronding', field: 'certificate' as keyof Course }
              ] as const
            ).map((item) => (
              <div key={item.field} className="flex items-center justify-between py-1">
                <span className="text-[12px] font-light text-[#1E1A14]">{item.label}</span>
                <label className="relative w-8 h-5 flex-shrink-0 block cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(course?.[item.field] as boolean) || false}
                    onChange={(e) => updateCourseField(item.field, e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="absolute inset-0 rounded-full bg-[rgba(30,26,20,0.12)] peer-checked:bg-[#C4A265] transition-colors duration-200"></div>
                  <div className="absolute top-[3px] left-[3px] w-[14px] h-[14px] rounded-full bg-white/40 peer-checked:bg-white peer-checked:translate-x-[12px] transition-all duration-200"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (currentContext === 'lesson' && currentLesson) {
      return (
        <div className="space-y-4">
          <div className="border-b border-[rgba(30,26,20,0.09)] pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#7A7268]">Les info</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Lesnaam</label>
                <input 
                  type="text"
                  value={currentLesson.name}
                  onChange={(e) => updateLessonField('name', e.target.value)}
                  className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)]"
                  placeholder="Naam van deze les"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Geschatte duur</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] text-[#7A7268] block mb-1">uur</label>
                    <input 
                      type="number"
                      min="0"
                      max="23"
                      value={Math.floor((currentLesson.duration || 0) / 60)}
                      onChange={(e) => {
                        const hours = parseInt(e.target.value) || 0
                        const minutes = (currentLesson.duration || 0) % 60
                        updateLessonField('duration', hours * 60 + minutes)
                      }}
                      className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[9px] text-[#7A7268] block mb-1">min</label>
                    <input 
                      type="number"
                      min="0"
                      max="59"
                      step="5"
                      value={(currentLesson.duration || 0) % 60}
                      onChange={(e) => {
                        const minutes = parseInt(e.target.value) || 0
                        const hours = Math.floor((currentLesson.duration || 0) / 60)
                        updateLessonField('duration', hours * 60 + minutes)
                      }}
                      className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)]"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-light text-[#1E1A14]">Gratis preview les</span>
                <label className="relative w-8 h-5 flex-shrink-0 block cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={currentLesson.free}
                    onChange={(e) => updateLessonField('free', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="absolute inset-0 rounded-full bg-[rgba(30,26,20,0.12)] peer-checked:bg-[#C4A265] transition-colors duration-200"></div>
                  <div className="absolute top-[3px] left-[3px] w-[14px] h-[14px] rounded-full bg-white/40 peer-checked:bg-white peer-checked:translate-x-[12px] transition-all duration-200"></div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="border-b border-[rgba(30,26,20,0.09)] pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#7A7268]">Reflectievragen na les</span>
            </div>
            <p className="text-[11px] text-[#7A7268] font-light leading-relaxed mb-3">
              Studenten beantwoorden deze vragen na de les — geen score, puur reflectie.
            </p>
            <div className="space-y-2">
              {currentLesson.reflectionQuestions?.map((question, index) => (
                <div key={index} className="bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-2 flex items-start gap-2">
                  <span className="font-['Cormorant_Garamond'] text-[13px] text-[rgba(196,162,101,0.5)] italic">1</span>
                  <input 
                    type="text"
                    value={question}
                    className="flex-1 bg-transparent outline-none text-[12px] text-[#1E1A14] leading-relaxed"
                    placeholder="bijv. Wat viel je op aan..."
                  />
                </div>
              ))}
            </div>
            <button 
              onClick={addReflectionQuestion}
              className="w-full flex items-center gap-2 p-2 rounded-[7px] border border-dashed border-[rgba(196,162,101,0.2)] bg-transparent text-[rgba(196,162,101,0.5)] text-[11px] hover:border-[rgba(196,162,101,0.4)] hover:text-[#C4A265] hover:bg-[rgba(196,162,101,0.04)] transition"
            >
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Vraag toevoegen
            </button>
          </div>
        </div>
      )
    }

    if (currentContext === 'quiz' && currentQuiz) {
      return (
        <div className="space-y-4">
          <div className="border-b border-[rgba(30,26,20,0.09)] pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#7A7268]">Toets instellingen</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Toetsnaam</label>
                <input 
                  type="text"
                  value={currentQuiz.name}
                  onChange={(e) => updateQuizField('name', e.target.value)}
                  className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)]"
                  placeholder="bijv. Tussentijdse toets"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Type</label>
                <select 
                  value={currentQuiz.type}
                  onChange={(e) => updateQuizField('type', e.target.value as 'intermediate' | 'final')}
                  className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)]"
                >
                  <option value="intermediate">Tussentijdse toets</option>
                  <option value="final">Eindtoets</option>
                </select>
              </div>
              <div>
                <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Minimale slagingsscore (%)</label>
                <input 
                  type="number"
                  value={currentQuiz.minPassingScore || ''}
                  onChange={(e) => updateQuizField('minPassingScore', parseInt(e.target.value) || undefined)}
                  className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)]"
                  placeholder="bijv. 70"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                {(
                  [
                    { label: 'Herkansing mogelijk', field: 'allowRetake' as keyof Quiz },
                    { label: 'Antwoorden tonen na afloop', field: 'showAnswers' as keyof Quiz },
                    { label: 'Volgorde randomiseren', field: 'randomize' as keyof Quiz }
                  ] as const
                ).map((item) => (
                  <div key={item.field} className="flex items-center justify-between">
                    <span className="text-[12px] font-light text-[#1E1A14]">{item.label}</span>
                    <label className="relative w-8 h-5 flex-shrink-0 block cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={(currentQuiz[item.field] as boolean) || false}
                        onChange={(e) => updateQuizField(item.field, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="absolute inset-0 rounded-full bg-[rgba(30,26,20,0.12)] peer-checked:bg-[#C4A265] transition-colors duration-200"></div>
                      <div className="absolute top-[3px] left-[3px] w-[14px] h-[14px] rounded-full bg-white/40 peer-checked:bg-white peer-checked:translate-x-[12px] transition-all duration-200"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case 'video':
        const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0]
          if (!file) return
          setVideoUploading(true)
          setVideoUploadProgress(0)
          try {
            // 1. Get upload URL from backend
            const res = await fetch('/api/mux/upload-url', { method: 'POST' })
            const { upload_url, upload_id } = await res.json()
            
            // 2. Upload to Mux via XHR for progress tracking
            await new Promise<void>((resolve, reject) => {
              const xhr = new XMLHttpRequest()
              xhr.upload.onprogress = (ev) => {
                if (ev.lengthComputable) setVideoUploadProgress(Math.round((ev.loaded / ev.total) * 100))
              }
              xhr.onload = () => resolve()
              xhr.onerror = () => reject(new Error('Upload failed'))
              xhr.open('PUT', upload_url)
              xhr.setRequestHeader('Content-Type', file.type)
              xhr.send(file)
            })
            
            // 3. Poll until asset is ready
            let attempts = 0
            while (attempts < 30) {
              await new Promise(r => setTimeout(r, 2000))
              const statusRes = await fetch(`/api/mux/asset-status?upload_id=${upload_id}`)
              const { status, asset_id, playback_id } = await statusRes.json()
              if (status === 'ready' && playback_id) {
                // Try to get a signed token
                let playbackToken = null;
                try {
                  const tokenRes = await fetch(`/api/mux/playback-token?playback_id=${playback_id}`);
                  const tokenData = await tokenRes.json();
                  playbackToken = tokenData.token;
                } catch { /* public asset, no token needed */ }
                
                // Update block content with Mux IDs and token
                const updatedBlocks = blocks.map(b => {
                  const currentContent = typeof b.content === 'object' && b.content !== null ? b.content : {}
                  return b.id === block.id 
                    ? { 
                        ...b, 
                        content: {
                          ...currentContent,
                          mux_asset_id: asset_id,
                          mux_playback_id: playback_id,
                          mux_playback_token: playbackToken,
                        }
                      }
                    : b
                })
                setBlocks(updatedBlocks)
                break
              }
              attempts++
            }
          } catch (err) {
            console.error('Upload error:', err)
            alert('Upload mislukt. Probeer opnieuw.')
          } finally {
            setVideoUploading(false)
          }
        }
        
        return (
          <div className="space-y-3">
            <input 
              ref={videoFileInputRef}
              type="file" 
              accept="video/*" 
              style={{ display: 'none' }} 
              onChange={handleVideoUpload} 
            />
            
            {typeof block.content === 'object' && block.content !== null && block.content.mux_playback_id ? (
              // Show video thumbnail/preview
              <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden' }}>
                <MuxPlayer
                  playbackId={block.content.mux_playback_id as string}
                  streamType="on-demand"
                  style={{ width: '100%', aspectRatio: '16/9' }}
                />
              </div>
            ) : videoUploading ? (
              // Progress bar
              <div style={{ padding: 20, textAlign: 'center' }}>
                <div style={{ width: '100%', height: 4, background: '#F0EDE6', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${videoUploadProgress}%`, height: '100%', background: '#C4A265', transition: 'width 0.3s' }} />
                </div>
                <p style={{ fontSize: 11, color: '#7A7268', marginTop: 8 }}>{videoUploadProgress}% — video wordt verwerkt...</p>
              </div>
            ) : (
              // Clickable upload zone
              <div 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); videoFileInputRef.current?.click() }} 
                style={{ cursor: 'pointer' }}
                className="w-full aspect-video bg-[#F0EDE6] rounded-lg flex flex-col items-center justify-center gap-2 p-4 border-1.5 border-dashed border-[rgba(30,26,20,0.12)] hover:bg-[rgba(196,162,101,0.04)] hover:border-[rgba(196,162,101,0.3)] transition"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={colors.gold} strokeWidth="1" style={{ opacity: 0.4 }}>
                  <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
                <span className="text-[10.5px] text-[#7A7268] tracking-[0.1em] uppercase">Video uploaden via Mux</span>
                <span className="text-[10.5px] text-[rgba(30,26,20,0.3)] font-light">MP4, MOV of MKV · klik om te kiezen</span>
              </div>
            )}
            
            <input 
              type="text"
              placeholder="Of plak een Vimeo / YouTube URL"
              className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12px] outline-none focus:border-[rgba(196,162,101,0.4)]"
            />
            <div className="flex gap-2 flex-wrap">
              <button className="text-[10.5px] font-medium p-1.5 px-2.5 rounded-full border border-[rgba(30,26,20,0.09)] text-[#7A7268] hover:border-[rgba(196,162,101,0.35)] hover:text-[#7A6340] hover:bg-[rgba(196,162,101,0.08)] transition">
                Autoplay
              </button>
              <button className="text-[10.5px] font-medium p-1.5 px-2.5 rounded-full border border-[rgba(30,26,20,0.09)] text-[#7A7268] hover:border-[rgba(196,162,101,0.35)] hover:text-[#7A6340] hover:bg-[rgba(196,162,101,0.08)] transition">
                Ondertitels
              </button>
            </div>
          </div>
        )

      case 'text': return <TextBlock block={block} onUpdate={updateBlock} />
      case 'image': return <ImageBlock block={block} onUpdate={updateBlock} />
      case 'quiz': return <QuizBlock block={block} onUpdate={updateBlock} />
      case 'callout': return <CalloutBlock block={block} onUpdate={updateBlock} />
      case 'download': return <DownloadBlock block={block} onUpdate={updateBlock} />

      case 'divider':
        return (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-[rgba(196,162,101,0.2)]"></div>
            <span className="text-[10px] text-[rgba(196,162,101,0.4)]">✦</span>
            <div className="flex-1 h-px bg-[rgba(196,162,101,0.2)]"></div>
          </div>
        )

      default:
        return null
    }
  }

  const renderPreview = () => {
    // Preview is puur een spiegel van blocks state. Geen hardcoded content.
    if (blocks.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 32, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>
          Geen blokken toegevoegd
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {blocks.map(block => {
          const content = typeof block.content === 'object' && block.content !== null ? block.content : {}

          if (block.type === 'video') {
            const playbackId = (content as {mux_playback_id?: string}).mux_playback_id
            if (playbackId) {
              return (
                <div key={block.id} style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }}>
                  <MuxPlayer
                    playbackId={playbackId}
                    streamType="on-demand"
                    style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8 }}
                  />
                </div>
              )
            }
            return (
              <div key={block.id} style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(0,0,0,0.4)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(196,162,101,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4A265' }}>▶</div>
              </div>
            )
          }

          if (block.type === 'text') {
            return (
              <div key={block.id} style={{ marginBottom: 12 }}>
                {block.title && (
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, color: 'rgba(250,248,244,0.88)', marginBottom: 4, lineHeight: 1.2 }}>
                    {block.title}
                  </p>
                )}
                {block.subtitle && (
                  <p style={{ fontSize: 13, color: 'rgba(250,248,244,0.5)', marginBottom: 6 }}>
                    {block.subtitle}
                  </p>
                )}
                {typeof block.content === 'string' && block.content && (
                  <div style={{ fontSize: 12.5, color: 'rgba(250,248,244,0.38)', lineHeight: 1.75 }} className="[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_s]:line-through [&_del]:line-through [&_strong]:font-semibold [&_em]:italic [&_mark]:rounded-sm [&_mark]:px-0.5" dangerouslySetInnerHTML={{ __html: block.content }} />
                )}
                {!block.title && !block.subtitle && !block.content && (
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)', fontStyle: 'italic' }}>Tekst blok — nog leeg</p>
                )}
              </div>
            )
          }

          if (block.type === 'image') {
            return (
              <div key={block.id} style={{ marginBottom: 12 }}>
                {block.url ? (
                  <img src={block.url} alt={block.caption || ''} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>Afbeelding</span>
                  </div>
                )}
                {block.caption && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 4 }}>{block.caption}</p>}
              </div>
            )
          }

          if (block.type === 'quiz') {
            return (
              <div key={block.id} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                <p style={{ fontSize: 13, color: 'rgba(250,248,244,0.7)', marginBottom: 8, fontWeight: 500 }}>
                  {block.question || 'Quizvraag — nog leeg'}
                </p>
                {(block.options || []).map((opt: { text: string; correct: boolean }, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: opt.correct ? 'rgba(80,190,120,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${opt.correct ? 'rgba(80,190,120,0.4)' : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: opt.correct ? 'rgba(80,190,120,0.9)' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                    <span style={{ fontSize: 12, color: opt.correct ? 'rgba(80,190,120,0.8)' : 'rgba(255,255,255,0.35)' }}>
                      {opt.text || `Antwoord ${String.fromCharCode(65 + i)}`}
                    </span>
                  </div>
                ))}
              </div>
            )
          }

          if (block.type === 'callout') {
            return (
              <div key={block.id} style={{ marginBottom: 12, background: 'rgba(196,162,101,0.07)', borderLeft: '3px solid rgba(196,162,101,0.35)', borderRadius: '0 8px 8px 0', padding: '10px 14px' }}>
                <p style={{ fontSize: 12.5, color: 'rgba(250,248,244,0.55)', lineHeight: 1.6 }}>
                  {typeof block.content === 'string' && block.content ? block.content : 'Tip / Note — nog leeg'}
                </p>
              </div>
            )
          }

          if (block.type === 'download') {
            return (
              <div key={block.id} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(196,162,101,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4A265', flexShrink: 0, fontSize: 14 }}>↓</div>
                <div>
                  <p style={{ fontSize: 12.5, color: 'rgba(250,248,244,0.7)', fontWeight: 500 }}>{block.fileName || 'Downloadbestand'}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{block.fileDescription || 'Klik om te downloaden'}</p>
                </div>
              </div>
            )
          }

          if (block.type === 'divider') {
            return (
              <div key={block.id} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(196,162,101,0.12)' }} />
                <span style={{ color: 'rgba(196,162,101,0.25)', fontSize: 10 }}>✦</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(196,162,101,0.12)' }} />
              </div>
            )
          }

          return null
        })}
      </div>
    )
  }

  const getBlockTypeLabel = (type: BlockType) => {
    const labels: Record<BlockType, string> = {
      video: 'Video',
      text: 'Titel + tekst',
      image: 'Afbeelding',
      quiz: 'Quiz vraag',
      callout: 'Tip / Note',
      download: 'Download',
      divider: 'Scheiding'
    }
    return labels[type]
  }

  const getBlockTypeIcon = (type: BlockType) => {
    const icons: Record<BlockType, string> = {
      video: '<path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>',
      text: '<path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12"/>',
      image: '<path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/>',
      quiz: '<path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      callout: '<path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>',
      download: '<path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>',
      divider: '<path d="M3.75 9h16.5m-16.5 6.75h16.5"/>'
    }
    return icons[type]
  }

  const getBlockTypeDescription = (type: BlockType) => {
    const descriptions: Record<BlockType, string> = {
      video: 'Mux of URL',
      text: 'Titel & body',
      image: 'Met bijschrift',
      quiz: 'Meerkeuze',
      callout: 'Gekleurde box',
      download: 'PDF of afbeelding',
      divider: 'Visuele break'
    }
    return descriptions[type]
  }

  /* ── Sortable Block Component ── */
  if (loading) return <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center"><div className="text-[#7A7268] text-[14px]">Laden...</div></div>
  if (!user) return null
  if (role !== 'admin') return <div className="min-h-screen bg-[#FAF8F4] flex items-center justify-center flex-col gap-4"><div className="text-[#7A7268] text-[14px]">Geen toegang.</div><a href="/admin" className="text-[13px] text-[#C4A265]">← Admin</a></div>

  {/* Pulse Animation Styles */}
  <style jsx>{`
    @keyframes pulse-gold {
      0%, 100% { 
        box-shadow: 0 0 0 0 rgba(196, 162, 101, 0); 
        border-color: rgba(196, 162, 101, 0.22); 
      }
      50% { 
        box-shadow: 0 0 0 6px rgba(196, 162, 101, 0.08); 
        border-color: rgba(196, 162, 101, 0.5); 
      }
    }
    .pulse-animation {
      animation: pulse-gold 2s infinite;
    }
    .pulse-animation:hover {
      animation: none;
    }
    .pulse-animation svg {
      animation: pulse-scale 2s infinite;
    }
    .pulse-animation:hover svg {
      animation: none;
    }
    @keyframes pulse-scale {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
  `}</style>

  return (
    <div className="min-h-screen bg-[#F0EDE6] overflow-hidden" style={{ fontFamily: "'Outfit', sans-serif" }}>
      {/* Main App */}
      <div className="flex" style={{ height: '100vh', paddingTop: '50px' }}>
        {/* Sidebar */}
        <div className="w-[260px] bg-[#FAF8F4] border-r border-[rgba(30,26,20,0.09)] overflow-y-auto flex flex-col">
          <div className="p-2.5 border-b border-[rgba(30,26,20,0.09)]">
            <span className="text-[9px] font-bold tracking-[0.22em] uppercase text-[#7A7268] block mb-1 px-0.5">
              Bezig met
            </span>
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => {
                  switchContext('global')
                  // Handle async without blocking
                }}
                className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border-none bg-transparent cursor-pointer w-full text-left transition relative ${currentContext === 'global' ? 'bg-[rgba(196,162,101,0.09)] border border-[rgba(196,162,101,0.18)]' : 'hover:bg-[rgba(30,26,20,0.04)]'}`}
              >
                <div className={`w-6 h-6 rounded-lg bg-[rgba(30,26,20,0.05)] flex items-center justify-center text-[#7A7268] flex-shrink-0 ${currentContext === 'global' ? 'bg-[rgba(196,162,101,0.14)] text-[#C4A265]' : ''}`}>
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M3 9h18M9 21V9"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <span className={`text-[12px] font-medium block leading-tight ${currentContext === 'global' ? 'text-[#7A6340]' : 'text-[#1E1A14]'}`}>
                    Cursus overzicht
                  </span>
                  <span className="text-[10px] text-[#7A7268] font-light">Algemene info</span>
                </div>
              </button>

              {course?.lessons?.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => {
                    switchContext('lesson', lesson)
                    // Handle async without blocking
                  }}
                  className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border-none bg-transparent cursor-pointer w-full text-left transition relative ${currentContext === 'lesson' && currentLesson?.id === lesson.id ? 'bg-[rgba(196,162,101,0.09)] border border-[rgba(196,162,101,0.18)]' : 'hover:bg-[rgba(30,26,20,0.04)]'}`}
                >
                  <div className={`w-6 h-6 rounded-lg bg-[rgba(30,26,20,0.05)] flex items-center justify-center text-[#7A7268] flex-shrink-0 ${currentContext === 'lesson' && currentLesson?.id === lesson.id ? 'bg-[rgba(196,162,101,0.14)] text-[#C4A265]' : ''}`}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <span className={`text-[12px] font-medium block leading-tight ${currentContext === 'lesson' && currentLesson?.id === lesson.id ? 'text-[#7A6340]' : 'text-[#1E1A14]'}`}>
                      Les {lesson.num}
                    </span>
                    <span className="text-[10px] text-[#7A7268] font-light">{lesson.name}</span>
                  </div>
                  {lesson.free && (
                    <span className="text-[8px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-full bg-[#C4A265] text-white flex-shrink-0">
                      Gratis
                    </span>
                  )}
                </button>
              ))}

              {course?.quizzes?.map((quiz) => (
                <button
                  key={quiz.id}
                  onClick={() => {
                    switchContext('quiz', quiz)
                    // Handle async without blocking
                  }}
                  className={`flex items-center gap-2 p-1.5 px-2 rounded-lg border-none bg-transparent cursor-pointer w-full text-left transition relative ${currentContext === 'quiz' && currentQuiz?.id === quiz.id ? 'bg-[rgba(196,162,101,0.09)] border border-[rgba(196,162,101,0.18)]' : 'hover:bg-[rgba(30,26,20,0.04)]'}`}
                >
                  <div className={`w-6 h-6 rounded-lg bg-[rgba(30,26,20,0.05)] flex items-center justify-center text-[#7A7268] flex-shrink-0 ${currentContext === 'quiz' && currentQuiz?.id === quiz.id ? 'bg-[rgba(196,162,101,0.14)] text-[#C4A265]' : ''}`}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <span className={`text-[12px] font-medium block leading-tight ${currentContext === 'quiz' && currentQuiz?.id === quiz.id ? 'text-[#7A6340]' : 'text-[#1E1A14]'}`}>
                      {quiz.name}
                    </span>
                    <span className="text-[10px] text-[#7A7268] font-light">Na les 2</span>
                  </div>
                  <span className="text-[8px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded-full bg-[rgba(80,190,120,0.08)] text-[rgba(80,190,120,0.9)] border border-[rgba(80,190,120,0.22)] flex-shrink-0">
                    Toets
                  </span>
                </button>
              ))}
            </div>
            
            <button
              onClick={addLesson}
              className="flex items-center gap-1.5 p-1.5 px-2 rounded-lg border border-dashed border-[rgba(196,162,101,0.22)] bg-transparent cursor-pointer w-full text-[rgba(196,162,101,0.5)] text-[11px] hover:border-[rgba(196,162,101,0.45)] hover:text-[#C4A265] hover:bg-[rgba(196,162,101,0.04)] transition mt-1"
            >
              <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Les of toets toevoegen
            </button>
          </div>

          {/* Sidebar Form — only for lesson/quiz context */}
          <div className="flex-1 p-2.5">
            {currentContext !== 'global' && renderSidebarForm()}
          </div>
        </div>

        {/* Builder */}
        <div className="flex-1 bg-[#F0EDE6] overflow-y-auto p-5 flex flex-col gap-2.5">
          {/* Context Banner */}
          <div className="bg-[#FAF8F4] border border-[rgba(30,26,20,0.09)] rounded-[14px] p-3 flex items-center gap-2.5 shadow-[0_1px_4px_rgba(30,26,20,0.06)]">
            <div className="w-8 h-8 rounded-lg bg-[rgba(196,162,101,0.1)] flex items-center justify-center text-[#C4A265] flex-shrink-0">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                {currentContext === 'global' && '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>'}
                {currentContext === 'lesson' && '<path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"/>'}
                {currentContext === 'quiz' && '<path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>'}
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-['Cormorant_Garamond'] text-[17px] font-medium text-[#1E1A14] tracking-[-0.01em]">
                {currentContext === 'global' && 'Cursus overzicht'}
                {currentContext === 'lesson' && currentLesson && `Les ${currentLesson.num} — ${currentLesson.name}`}
                {currentContext === 'quiz' && currentQuiz && currentQuiz.name}
              </div>
              <div className="text-[11px] text-[#7A7268] font-light">
                {currentContext === 'global' && 'Landing pagina + instellingen'}
                {currentContext === 'lesson' && 'Inhoud van les'}
                {currentContext === 'quiz' && 'Voeg quizvragen toe'}
              </div>
            </div>
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-1 rounded-full border border-[rgba(196,162,101,0.25)] text-[#7A6340] bg-[rgba(196,162,101,0.08)]">
              {currentContext === 'global' && ''}
              {currentContext === 'lesson' && 'Les'}
              {currentContext === 'quiz' && 'Toets'}
            </span>
          </div>

          {/* Content Blocks — only for lesson/quiz context */}
          {currentContext !== 'global' && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <SortableBlock key={block.id} block={block}>
                  <div className="bg-[#FAF8F4] border border-[rgba(30,26,20,0.09)] rounded-[14px] overflow-hidden transition-all hover:border-[rgba(196,162,101,0.3)] hover:shadow-[0_2px_10px_rgba(30,26,20,0.08)] ml-8">
              <div className="flex items-center justify-between p-2.5 bg-[#F0EDE6] border-b border-[rgba(30,26,20,0.09)]">
                <div className="flex items-center gap-2">
                  <span className="text-[9.5px] font-bold tracking-[0.18em] uppercase text-[#7A6340]">
                    {getBlockTypeLabel(block.type)}
                  </span>
                </div>
                <button 
                  onClick={() => deleteBlock(block.id)}
                  className="w-6 h-6 rounded-lg border-none bg-transparent cursor-pointer flex items-center justify-center text-[#7A7268] hover:bg-[rgba(30,26,20,0.04)] hover:text-[#1E1A14] transition"
                >
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-3.5">
                {renderBlock(block)}
              </div>
            </div>
          </SortableBlock>
          ))}
          </SortableContext>
          </DndContext>
          )}

          {/* Global context: Course landing form in main canvas */}
          {currentContext === 'global' && (
            <div className="max-w-2xl mx-auto">
              {renderSidebarForm()}
            </div>
          )}

          {/* Add Block Button — only for lesson/quiz context */}
          {currentContext !== 'global' && (
          <div className="relative">
            <button
              ref={addBlockButtonRef}
              onClick={() => { openPicker() }}
              className="flex items-center justify-center gap-2 p-3 rounded-[14px] border-1.5 border-dashed border-[rgba(196,162,101,0.2)] bg-transparent cursor-pointer text-[rgba(196,162,101,0.5)] text-[12px] hover:border-[rgba(196,162,101,0.45)] hover:text-[#C4A265] hover:bg-[rgba(196,162,101,0.04)] transition w-full"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Blok toevoegen
            </button>

            {/* Block Picker Dropdown */}
            {pickerOpen && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }} 
                  onClick={() => setPickerOpen(false)} 
                />
                <div 
                  className="bg-[#FAF8F4] border border-[rgba(30,26,20,0.09)] rounded-[12px] shadow-[0_8px_32px_rgba(30,26,20,0.14)] p-2 z-[100] min-w-[220px] flex flex-wrap gap-1 block-picker show"
                  style={{
                    position: 'fixed',
                    top: blockPickerPosition.top,
                    left: blockPickerPosition.left,
                    width: 340
                  }}
                >
                {(['video', 'text', 'image', 'quiz', 'callout', 'download', 'divider'] as BlockType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      addBlock(type)
                      setPickerOpen(false)
                    }}
                    className="flex items-center gap-2 p-2 px-2.5 rounded-lg border-none bg-transparent cursor-pointer w-[calc(50%-4px)] transition hover:bg-[rgba(196,162,101,0.08)]"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[rgba(196,162,101,0.1)] flex items-center justify-center text-[#C4A265] flex-shrink-0">
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" dangerouslySetInnerHTML={{ __html: getBlockTypeIcon(type) }} />
                    </div>
                    <div className="text-left">
                      <div className="text-[12px] font-medium text-[#1E1A14]">
                        {getBlockTypeLabel(type)}
                      </div>
                      <div className="text-[10px] text-[#7A7268]">
                        {getBlockTypeDescription(type)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              </>
            )}
          </div>
          )}
        </div>

        {/* Preview */}
        <div className="w-[320px] bg-[#161310] border-l border-[rgba(255,255,255,0.05)] overflow-y-auto flex flex-col">
          <div className="sticky top-0 bg-[#161310] z-10">
            <div className="p-3.5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <span className="text-[9.5px] font-bold tracking-[0.22em] uppercase text-[rgba(196,162,101,0.5)]">
                Student preview
              </span>
              <div className="flex gap-1">
                <button className="w-6 h-6 rounded-lg border border-[rgba(255,255,255,0.08)] bg-transparent flex items-center justify-center text-[rgba(255,255,255,0.28)]">
                  <svg width="12" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8m-4-4v4"/>
                  </svg>
                </button>
                <button className="w-6 h-6 rounded-lg border border-[rgba(255,255,255,0.08)] bg-transparent flex items-center justify-center text-[rgba(255,255,255,0.28)]">
                  <svg width="10" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2"/>
                    <path d="M12 18h.01"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Lesson Indicator */}
            <div className="flex items-center gap-2 p-3.5 border-b border-[rgba(255,255,255,0.05)]">
              <span className="font-['Cormorant_Garamond'] text-[13px] text-[rgba(196,162,101,0.5)] italic">✦</span>
              <span className="text-[12px] font-medium text-[rgba(250,248,244,0.65)]">
                {currentContext === 'global' && 'Cursus overzicht'}
                {currentContext === 'lesson' && currentLesson && `Les ${currentLesson.num} — ${currentLesson.name}`}
                {currentContext === 'quiz' && currentQuiz && currentQuiz.name}
              </span>
              <span className={`text-[8.5px] font-bold tracking-[0.1em] uppercase px-2 py-1 rounded-full ml-auto ${
                currentContext === 'global' ? 'bg-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.3)] border border-[rgba(255,255,255,0.08)]' :
                currentContext === 'lesson' ? (currentLesson?.free ? 'bg-[#C4A265] text-white' : 'bg-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.3)] border border-[rgba(255,255,255,0.08)]') :
                'bg-[rgba(80,190,120,0.08)] text-[rgba(80,190,120,0.9)] border border-[rgba(80,190,120,0.22)]'
              }`}>
                {currentContext === 'global' && ''}
                {currentContext === 'lesson' && (currentLesson?.free ? 'Gratis preview' : 'Account vereist')}
                {currentContext === 'quiz' && 'Toets'}
              </span>
            </div>
          </div>

          <div className="p-3.5">
            {renderPreview()}
          </div>
        </div>
      </div>
    </div>
  )
}