'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase-client'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import MuxPlayer from '@mux/mux-player-react'

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

  const saveCourse = useCallback(async () => {
    if (!course) return

    // 1. Upsert course
    const { error: courseError } = await supabase.from('courses').upsert({
      id: course.id,
      title: course.title,
      description: course.description || null,
      is_first_lesson_free: course.firstLessonFree || false,
      intro_video: course.introVideo || false,
      final_quiz_required: course.finalQuizRequired || false,
      certificate: course.certificate || false,
      status: 'draft'
    })
    if (courseError) { console.error('Course error:', courseError); return }

    // 2. Sla les + blokken op als we in een les context zijn
    if (currentContext === 'lesson' && currentLesson) {
      await supabase.from('lessons').upsert({
        id: currentLesson.id,
        course_id: course.id,
        title: currentLesson.name,
        is_free: currentLesson.free,
        sort_order: currentLesson.num - 1,
        duration_seconds: (currentLesson.duration || 0) * 60,
      })

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i]
        const content = typeof block.content === 'object' && block.content !== null ? block.content : {}
        await supabase.from('blocks').upsert({
          id: block.id,
          lesson_id: currentLesson.id,
          course_id: course.id,
          type: block.type,
          sort_order: i,
          content: {
            title: block.title,
            subtitle: block.subtitle,
            content: block.content,
            url: block.url,
            mux_asset_id: (content as {mux_asset_id?: string}).mux_asset_id,
            mux_playback_id: (content as {mux_playback_id?: string}).mux_playback_id,
            question: block.question,
            options: block.options,
          }
        })
      }
    }

    alert('Concept opgeslagen!')
  }, [course, currentContext, currentLesson, blocks])

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

  const updateCourseField = (field: keyof Course, value: string | boolean | Lesson[] | Quiz[] | undefined) => {
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
          <div className="border-b border-[rgba(30,26,20,0.09)] pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#7A7268]">Cursusinformatie</span>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10.5px] font-medium text-[#7A7268] block mb-1">Korte beschrijving</label>
                <textarea 
                  value={course?.description || ''}
                  onChange={(e) => updateCourseField('description', e.target.value)}
                  className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12.5px] outline-none focus:border-[rgba(196,162,101,0.45)] min-h-[60px]"
                  placeholder="Wat leren studenten in deze cursus?"
                />
              </div>
            </div>
          </div>
          
          <div className="border-b border-[rgba(30,26,20,0.09)] pb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-semibold tracking-[0.22em] uppercase text-[#7A7268]">Toegang</span>
            </div>
            <div className="space-y-2">
              {(
                [
                  { label: 'Eerste les gratis preview', field: 'firstLessonFree' as keyof Course },
                  { label: 'Intro video op cursuspagina', field: 'introVideo' as keyof Course },
                  { label: 'Eindtoets verplicht', field: 'finalQuizRequired' as keyof Course },
                  { label: 'Certificaat bij afronding', field: 'certificate' as keyof Course }
                ] as const
              ).map((item) => (
                <div key={item.field} className="flex items-center justify-between">
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
          
          <div className="pt-4">
            <p className="text-[11px] text-[#7A7268] text-center leading-relaxed">
              Thumbnail, niveau, prijs en certificaat stel je in bij <strong className="text-[#1E1A14]">Publiceren</strong> →
            </p>
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

      case 'text':
        return (
          <div className="space-y-2">
            <input 
              type="text"
              placeholder="Hoofdtitel..."
              className="w-full bg-transparent border-none outline-none font-['Cormorant_Garamond'] text-[22px] font-medium text-[#1E1A14] tracking-[-0.01em]"
            />
            <input 
              type="text"
              placeholder="Subtitel of introductie..."
              className="w-full bg-transparent border-none outline-none text-[14px] text-[#7A7268] mt-1"
            />
            <textarea 
              rows={3}
              placeholder="Schrijf hier de inhoud van dit blok..."
              className="w-full bg-transparent border-none outline-none text-[13px] font-light text-[#7A7268] leading-relaxed resize-none min-h-[60px] mt-2"
            />
          </div>
        )

      case 'image':
        return (
          <div className="space-y-2">
            <div className="w-full aspect-video bg-[#F0EDE6] rounded-lg flex flex-col items-center justify-center gap-2 p-4 border-1.5 border-dashed border-[rgba(30,26,20,0.12)] cursor-pointer hover:border-[rgba(196,162,101,0.3)] hover:bg-[rgba(196,162,101,0.03)] transition">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={colors.gold} strokeWidth="1" style={{ opacity: 0.35 }}>
                <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
              </svg>
            </div>
            <input 
              type="text"
              placeholder="Bijschrift (optioneel)"
              className="w-full bg-transparent border-none outline-none text-[11.5px] text-[#7A7268] italic text-center mt-1"
            />
          </div>
        )

      case 'quiz':
        return (
          <div className="space-y-3">
            <input 
              type="text"
              placeholder="Wat is de vraag?"
              className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[8px] p-[9px_12px] text-[13px] outline-none focus:border-[rgba(80,190,120,0.4)]"
            />
            <div className="space-y-2">
              {['A', 'B', 'C'].map((letter, index) => (
                <div key={letter} className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full bg-[#F0EDE6] border border-[rgba(30,26,20,0.09)] flex items-center justify-center text-[9.5px] font-medium text-[#7A7268] flex-shrink-0 cursor-pointer transition ${index === 0 ? 'bg-[rgba(80,190,120,0.08)] border-[rgba(80,190,120,0.22)] text-[rgba(80,190,120,0.9)]' : ''}`}>
                    {letter}
                  </div>
                  <input 
                    type="text"
                    placeholder={`Antwoord ${letter}`}
                    className="flex-1 bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12px] outline-none"
                  />
                  {index > 1 && (
                    <button className="text-[rgba(30,26,20,0.2)] hover:text-[rgba(200,60,60,0.6)] transition p-1">
                      <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button className="text-[11px] text-[rgba(80,190,120,0.6)] hover:text-[rgba(80,190,120,0.9)] transition p-1">
              + Optie toevoegen
            </button>
            <div className="flex gap-2 pt-2 border-t border-[rgba(30,26,20,0.09)] flex-wrap">
              <select className="bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-1 px-2 text-[11px] text-[#7A7268] outline-none cursor-pointer">
                <option>Tussentijds</option>
                <option>Eindtoets</option>
              </select>
              <input 
                type="number"
                placeholder="Punten"
                className="bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-1 px-2 text-[11px] text-[#1E1A14] outline-none w-16"
              />
              <span className="text-[9px] font-bold tracking-[0.14em] uppercase px-2 py-1 rounded-full bg-[rgba(80,190,120,0.08)] text-[rgba(80,190,120,0.9)] border border-[rgba(80,190,120,0.22)]">
                Quiz
              </span>
            </div>
          </div>
        )

      case 'callout':
        return (
          <div className="flex gap-3 items-start bg-[rgba(196,162,101,0.07)] border-l-3 border-[rgba(196,162,101,0.35)] rounded-r-lg p-3">
            <span className="text-[17px] flex-shrink-0 mt-0.5">💡</span>
            <textarea 
              rows={2}
              placeholder="Tip of opmerking..."
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#1E1A14] leading-relaxed resize-none min-h-[45px]"
            />
          </div>
        )

      case 'download':
        return (
          <div className="space-y-3">
            <div className="w-full bg-[#F0EDE6] border-1.5 border-dashed border-[rgba(30,26,20,0.12)] rounded-lg p-5 flex flex-col items-center gap-2 cursor-pointer hover:bg-[rgba(196,162,101,0.04)] hover:border-[rgba(196,162,101,0.3)] transition text-center">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke={colors.gold} strokeWidth="1" style={{ opacity: 0.5 }}>
                <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              <span className="text-[10.5px] text-[#7A7268] tracking-[0.1em] uppercase">Bestand uploaden</span>
              <span className="text-[10.5px] text-[rgba(30,26,20,0.3)] font-light">PDF of afbeelding · max 50MB</span>
            </div>
            <div className="space-y-2">
              <input 
                type="text"
                placeholder="Bestandsnaam voor studenten, bijv. Werkblad les 1"
                className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12px] outline-none"
              />
              <input 
                type="text"
                placeholder="Korte beschrijving (optioneel)"
                className="w-full bg-white border border-[rgba(30,26,20,0.09)] rounded-[7px] p-[7px_10px] text-[12px] outline-none"
              />
            </div>
          </div>
        )

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
    if (currentContext === 'global') {
      return (
        <div>
          <div style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(0,0,0,0.4)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(196,162,101,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C4A265' }}>▶</div>
          </div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 21, color: 'rgba(250,248,244,0.88)', marginBottom: 5 }}>{course?.title || 'Cursusnaam'}</p>
          <p style={{ fontSize: 11.5, color: 'rgba(250,248,244,0.35)', marginBottom: 12 }}>Intro video — klik om te starten</p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(196,162,101,0.5)', display: 'block', marginBottom: 7 }}>Inhoud van de cursus</span>
            {course?.lessons?.map(lesson => (
              <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 7, marginBottom: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 12, color: 'rgba(196,162,101,0.4)', fontStyle: 'italic' }}>{lesson.num}</span>
                <span style={{ fontSize: 11.5, color: 'rgba(250,248,244,0.6)', flex: 1 }}>{lesson.name}</span>
                {lesson.free && <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 100, background: '#C4A265', color: '#fff' }}>Gratis</span>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (currentContext === 'lesson' || currentContext === 'quiz') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {blocks.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Voeg blokken toe in de builder</div>
          )}
          {blocks.map(block => {
            const content = typeof block.content === 'object' && block.content !== null ? block.content : {}

            if (block.type === 'video') {
              const playbackId = (content as {mux_playback_id?: string}).mux_playback_id
              if (playbackId) {
                return (
                  <MuxPlayer
                    key={block.id}
                    playbackId={playbackId}
                    streamType="on-demand"
                    style={{ width: '100%', aspectRatio: '16/9', borderRadius: 8 }}
                  />
                )
              }
              return (
                <div key={block.id} style={{ width: '100%', aspectRatio: '16/9', background: 'rgba(0,0,0,0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>Video</span>
                </div>
              )
            }

            if (block.type === 'text') {
              return (
                <div key={block.id}>
                  {block.title && <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, color: 'rgba(250,248,244,0.88)', marginBottom: 4 }}>{block.title}</p>}
                  {block.subtitle && <p style={{ fontSize: 13, color: 'rgba(250,248,244,0.5)', marginBottom: 6 }}>{block.subtitle}</p>}
                  {typeof block.content === 'string' && block.content && <p style={{ fontSize: 12.5, color: 'rgba(250,248,244,0.38)', lineHeight: 1.75 }}>{block.content}</p>}
                </div>
              )
            }

            if (block.type === 'callout') {
              return (
                <div key={block.id} style={{ background: 'rgba(196,162,101,0.07)', borderLeft: '3px solid rgba(196,162,101,0.3)', borderRadius: '0 8px 8px 0', padding: '12px 14px', fontSize: 12.5, color: 'rgba(250,248,244,0.55)', lineHeight: 1.6 }}>
                  💡 {typeof block.content === 'string' ? block.content : ''}
                </div>
              )
            }

            if (block.type === 'divider') {
              return (
                <div key={block.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(196,162,101,0.12)' }} />
                  <span style={{ color: 'rgba(196,162,101,0.3)', fontSize: 10 }}>✦</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(196,162,101,0.12)' }} />
                </div>
              )
            }

            return null
          })}
        </div>
      )
    }

    return null
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
  function SortableBlock({ block, children }: { block: Block, children: React.ReactNode }) {
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

          {/* Sidebar Form */}
          <div className="flex-1 p-2.5">
            {renderSidebarForm()}
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
                {currentContext === 'global' && 'Voeg blokken toe voor de cursuspagina'}
                {currentContext === 'lesson' && 'Inhoud van les'}
                {currentContext === 'quiz' && 'Voeg quizvragen toe'}
              </div>
            </div>
            <span className="text-[9px] font-bold tracking-[0.16em] uppercase px-2 py-1 rounded-full border border-[rgba(196,162,101,0.25)] text-[#7A6340] bg-[rgba(196,162,101,0.08)]">
              {currentContext === 'global' && 'Globaal'}
              {currentContext === 'lesson' && 'Les'}
              {currentContext === 'quiz' && 'Toets'}
            </span>
          </div>

          {/* Content Blocks */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <SortableBlock key={block.id} block={block}>
                  <div className="bg-[#FAF8F4] border border-[rgba(30,26,20,0.09)] rounded-[14px] overflow-hidden transition-all hover:border-[rgba(196,162,101,0.3)] hover:shadow-[0_2px_10px_rgba(30,26,20,0.08)] ml-8">
              <div className="flex items-center justify-between p-2.5 bg-[#F0EDE6] border-b border-[rgba(30,26,20,0.09)]">
                <div className="flex items-center gap-2">
                  <svg width="9" height="13" viewBox="0 0 9 13" fill="none" className="text-[#7A7268] opacity-50">
                    <circle cx="2.5" cy="2" r="1.1" fill="currentColor"/>
                    <circle cx="6.5" cy="2" r="1.1" fill="currentColor"/>
                    <circle cx="2.5" cy="6.5" r="1.1" fill="currentColor"/>
                    <circle cx="6.5" cy="6.5" r="1.1" fill="currentColor"/>
                    <circle cx="2.5" cy="11" r="1.1" fill="currentColor"/>
                    <circle cx="6.5" cy="11" r="1.1" fill="currentColor"/>
                  </svg>
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

          {/* Add Block Button */}
          <div className="relative">
            <button
              ref={addBlockButtonRef}
              onClick={() => {
                openPicker()
              }}
              className="flex items-center justify-center gap-2 p-3 rounded-[14px] border-1.5 border-dashed border-[rgba(196,162,101,0.2)] bg-transparent cursor-pointer text-[rgba(196,162,101,0.5)] text-[12px] hover:border-[rgba(196,162,101,0.45)] hover:text-[#C4A265] hover:bg-[rgba(196,162,101,0.04)] transition w-full pulse-animation"
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
                {currentContext === 'global' && 'Globaal'}
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