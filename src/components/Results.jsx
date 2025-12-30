import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Award } from 'lucide-react';

export default function Results({ results }) {
  const { score, feedback, is_suspicious, tab_switch_count } = results;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-blue-100 border-blue-200';
    if (score >= 40) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <Award className="w-16 h-16 text-green-600" />;
    if (score >= 60) return <TrendingUp className="w-16 h-16 text-blue-600" />;
    return <TrendingDown className="w-16 h-16 text-red-600" />;
  };

  const getGrade = (score) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-12 text-center">
            <h1 className="text-4xl font-bold mb-2">Interview Complete!</h1>
            <p className="text-blue-100 text-lg">Here are your results</p>
          </div>

          <div className="p-8 space-y-8">
            <div className={`border-2 rounded-2xl p-8 text-center ${getScoreBg(score)}`}>
              <div className="flex justify-center mb-4">
                {getScoreIcon(score)}
              </div>
              <div className={`text-7xl font-bold mb-2 ${getScoreColor(score)}`}>
                {score}%
              </div>
              <div className={`text-3xl font-semibold ${getScoreColor(score)}`}>
                Grade: {getGrade(score)}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">Performance</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Score</span>
                    <span className={`font-bold text-lg ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Grade</span>
                    <span className={`font-bold text-lg ${getScoreColor(score)}`}>
                      {getGrade(score)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`border rounded-xl p-6 ${
                is_suspicious
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {is_suspicious ? (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-800">Behavior</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tab Switches</span>
                    <span className={`font-bold text-lg ${
                      tab_switch_count > 3 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {tab_switch_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-semibold ${
                      is_suspicious ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {is_suspicious ? 'Suspicious' : 'Clean'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {is_suspicious && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      Suspicious Activity Detected
                    </h3>
                    <p className="text-red-700">
                      Multiple tab switches were detected during your interview. This may indicate
                      that you were looking for answers elsewhere. In a real interview setting,
                      this could disqualify your results.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                AI Feedback
              </h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {feedback}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Take Another Interview
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
