'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';
import { useTranslation } from 'react-i18next';
import { plantsAPI, helpMessageAPI } from '@/lib/api';

export default function AccountPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [plantCount, setPlantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showHelpForm, setShowHelpForm] = useState(false);
  const [helpMessage, setHelpMessage] = useState('');
  const [helpCategory, setHelpCategory] = useState('question');
  const [submittingHelp, setSubmittingHelp] = useState(false);
  const [helpSubmitted, setHelpSubmitted] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPlantCount();
  }, [user, authLoading, router]);

  const fetchPlantCount = async () => {
    try {
      const plants = await plantsAPI.getPlants();
      setPlantCount(plants.length);
    } catch (error) {
      console.error('Failed to fetch plants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingHelp(true);

    try {
      await helpMessageAPI.submitMessage({
        category: helpCategory,
        message: helpMessage,
      });

      setHelpSubmitted(true);
      setHelpMessage('');
      setTimeout(() => {
        setShowHelpForm(false);
        setHelpSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit help message:', error);
      alert('Failed to submit your message. Please try again.');
    } finally {
      setSubmittingHelp(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const getLevel = (count: number) => {
    if (count >= 50) return { level: 5, title: t('account.masterGardener'), emoji: '🌳' };
    if (count >= 25) return { level: 4, title: t('account.expertGardener'), emoji: '🌲' };
    if (count >= 10) return { level: 3, title: t('account.skilledGardener'), emoji: '🌿' };
    if (count >= 5) return { level: 2, title: t('account.growingGardener'), emoji: '🌱' };
    return { level: 1, title: t('account.beginnerGardener'), emoji: '🌾' };
  };

  const userLevel = getLevel(plantCount);
  const nextLevelPlants = plantCount < 5 ? 5 : plantCount < 10 ? 10 : plantCount < 25 ? 25 : plantCount < 50 ? 50 : 100;
  const progress = ((plantCount % nextLevelPlants) / nextLevelPlants) * 100;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50">
        <Header />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 pb-20">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 border-2 border-green-100">
          <div className="flex items-center mb-6">
            {user?.avatar && (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-24 h-24 rounded-full border-4 border-green-500 mr-6"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{user?.name}</h1>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center mt-3">
                <span className="text-4xl mr-2">{userLevel.emoji}</span>
                <div>
                  <p className="text-lg font-semibold text-green-700">{userLevel.title}</p>
                  <p className="text-sm text-gray-500">{t('account.level')} {userLevel.level}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">{t('account.progressToNextLevel')}</span>
              <span className="text-green-600 font-semibold">{plantCount} / {nextLevelPlants} {t('account.plants')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 text-center border border-green-100">
              <p className="text-3xl font-bold text-green-600">{plantCount}</p>
              <p className="text-sm text-gray-600 mt-1">{t('account.totalPlants')}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 text-center border border-blue-100">
              <p className="text-3xl font-bold text-blue-600">{userLevel.level}</p>
              <p className="text-sm text-gray-600 mt-1">{t('account.currentLevel')}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 text-center border border-purple-100">
              <p className="text-3xl font-bold text-purple-600">🏆</p>
              <p className="text-sm text-gray-600 mt-1">{t('account.achievements')}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 text-center border border-yellow-100">
              <p className="text-3xl font-bold text-orange-600">⭐</p>
              <p className="text-sm text-gray-600 mt-1">{t('account.badges')}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setShowHelpForm(true)}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('account.needHelp')}
            </button>

            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-4 px-6 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {t('auth.signOut')}
            </button>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-green-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🏅</span>
            {t('account.yourAchievements')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-2xl text-center ${plantCount >= 1 ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-2 border-green-300' : 'bg-gray-100 opacity-50'}`}>
              <p className="text-4xl mb-2">🌱</p>
              <p className="text-sm font-semibold">{t('account.firstPlant')}</p>
            </div>
            <div className={`p-4 rounded-2xl text-center ${plantCount >= 5 ? 'bg-gradient-to-br from-blue-100 to-cyan-100 border-2 border-blue-300' : 'bg-gray-100 opacity-50'}`}>
              <p className="text-4xl mb-2">🌿</p>
              <p className="text-sm font-semibold">{t('account.fivePlants')}</p>
            </div>
            <div className={`p-4 rounded-2xl text-center ${plantCount >= 10 ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300' : 'bg-gray-100 opacity-50'}`}>
              <p className="text-4xl mb-2">🌲</p>
              <p className="text-sm font-semibold">{t('account.tenPlants')}</p>
            </div>
            <div className={`p-4 rounded-2xl text-center ${plantCount >= 25 ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-yellow-300' : 'bg-gray-100 opacity-50'}`}>
              <p className="text-4xl mb-2">🌳</p>
              <p className="text-sm font-semibold">{t('account.twentyFivePlants')}</p>
            </div>
            <div className={`p-4 rounded-2xl text-center ${plantCount >= 50 ? 'bg-gradient-to-br from-red-100 to-pink-100 border-2 border-red-300' : 'bg-gray-100 opacity-50'}`}>
              <p className="text-4xl mb-2">🏆</p>
              <p className="text-sm font-semibold">{t('account.fiftyPlants')}</p>
            </div>
            <div className={`p-4 rounded-2xl text-center ${plantCount >= 100 ? 'bg-gradient-to-br from-indigo-100 to-purple-100 border-2 border-indigo-300' : 'bg-gray-100 opacity-50'}`}>
              <p className="text-4xl mb-2">👑</p>
              <p className="text-sm font-semibold">{t('account.hundredPlants')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Form Modal */}
      {showHelpForm && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowHelpForm(false)}></div>
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="text-3xl mr-3">💬</span>
                {t('account.needHelp')}
              </h2>

              {helpSubmitted ? (
                <div className="text-center py-8">
                  <p className="text-6xl mb-4">✅</p>
                  <p className="text-xl font-semibold text-green-600">{t('account.messageSent')}</p>
                  <p className="text-gray-600 mt-2">{t('account.wellGetBack')}</p>
                </div>
              ) : (
                <form onSubmit={handleHelpSubmit}>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('account.category')}
                    </label>
                    <select
                      value={helpCategory}
                      onChange={(e) => setHelpCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="question">{t('account.question')}</option>
                      <option value="bug">{t('account.bugReport')}</option>
                      <option value="feature">{t('account.featureRequest')}</option>
                      <option value="other">{t('account.other')}</option>
                    </select>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {t('account.yourMessage')}
                    </label>
                    <textarea
                      value={helpMessage}
                      onChange={(e) => setHelpMessage(e.target.value)}
                      required
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={t('account.messagePlaceholder')}
                    ></textarea>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowHelpForm(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-all"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={submittingHelp}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
                    >
                      {submittingHelp ? t('common.sending') : t('common.send')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}

      <MobileBottomNav />
    </div>
  );
}
