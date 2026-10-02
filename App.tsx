import { Suspense, lazy } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute, PublicOnly } from '@/components/layout/ProtectedRoute'
import { PageSkeleton } from '@/components/ui/States'
import Landing from '@/pages/Landing/Landing'
import Login from '@/pages/Auth/Login'
import Register from '@/pages/Auth/Register'
import NotFound from '@/pages/NotFound'

const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'))
const Learn = lazy(() => import('@/pages/Learn/Learn'))
const Course = lazy(() => import('@/pages/Learn/Course'))
const Module = lazy(() => import('@/pages/Learn/Module'))
const Lesson = lazy(() => import('@/pages/Learn/Lesson'))
const Algorithms = lazy(() => import('@/pages/Algorithms/Algorithms'))
const AlgorithmDetail = lazy(() => import('@/pages/Algorithms/AlgorithmDetail'))
const QuantumLab = lazy(() => import('@/pages/QuantumLab/QuantumLab'))
const Circuits = lazy(() => import('@/pages/Circuits/Circuits'))
const Challenges = lazy(() => import('@/pages/Challenges/Challenges'))
const ChallengeDetail = lazy(() => import('@/pages/Challenges/ChallengeDetail'))
const Quiz = lazy(() => import('@/pages/Quizzes/Quiz'))
const Progress = lazy(() => import('@/pages/Progress/Progress'))
const Achievements = lazy(() => import('@/pages/Progress/Achievements'))
const AITutor = lazy(() => import('@/pages/AITutor/AITutor'))
const Profile = lazy(() => import('@/pages/Profile/Profile'))
const Settings = lazy(() => import('@/pages/Settings/Settings'))
const Staff = {
  InstructorHome: lazy(() => import('@/pages/Role/Staff').then((m) => ({ default: m.InstructorHome }))),
  InstructorStudents: lazy(() => import('@/pages/Role/Staff').then((m) => ({ default: m.InstructorStudents }))),
  InstructorAnalytics: lazy(() => import('@/pages/Role/Staff').then((m) => ({ default: m.InstructorAnalytics }))),
  AdminHome: lazy(() => import('@/pages/Role/Staff').then((m) => ({ default: m.AdminHome }))),
  AdminUsers: lazy(() => import('@/pages/Role/Staff').then((m) => ({ default: m.AdminUsers }))),
  AdminContent: lazy(() => import('@/pages/Role/Staff').then((m) => ({ default: m.AdminContent }))),
  AdminAnalytics: lazy(() => import('@/pages/Role/Staff').then((m) => ({ default: m.AdminAnalytics }))),
}

function SimulationRedirect() {
  const { id } = useParams()
  return <Navigate to={`/circuits/${id ?? ''}?run=1`} replace />
}

export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route element={<PublicOnly />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/courses/:courseId" element={<Course />} />
            <Route path="/learn/modules/:moduleId" element={<Module />} />
            <Route path="/learn/lessons/:lessonId" element={<Lesson />} />
            <Route path="/algorithms" element={<Algorithms />} />
            <Route path="/algorithms/:slug" element={<AlgorithmDetail />} />
            <Route path="/quantum-lab" element={<QuantumLab />} />
            <Route path="/circuits" element={<Circuits />} />
            <Route path="/circuits/:id" element={<QuantumLab />} />
            <Route path="/simulations/:id" element={<SimulationRedirect />} />
            <Route path="/challenges" element={<Challenges />} />
            <Route path="/challenges/:id" element={<ChallengeDetail />} />
            <Route path="/quizzes/:id" element={<Quiz />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/ai-tutor" element={<AITutor />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['instructor', 'admin']} />}>
          <Route element={<AppShell />}>
            <Route path="/instructor" element={<Staff.InstructorHome />} />
            <Route path="/instructor/students" element={<Staff.InstructorStudents />} />
            <Route path="/instructor/analytics" element={<Staff.InstructorAnalytics />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<AppShell />}>
            <Route path="/admin" element={<Staff.AdminHome />} />
            <Route path="/admin/users" element={<Staff.AdminUsers />} />
            <Route path="/admin/content" element={<Staff.AdminContent />} />
            <Route path="/admin/analytics" element={<Staff.AdminAnalytics />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
