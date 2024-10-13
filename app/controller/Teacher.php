<?php

namespace app\controller;

use Exception;
use think\facade\Db;

class Teacher
{
    public function getInfo()
    {
        $user = checkLogin();
//        if ($user['type'] != 1) {
//            return returnJson(1, '无权限');
//        }
        //获取正在上课的信息
//        $data = Db::table('tb_record_course')->where('uid', $user['uid'])->where('end_time', null)->find();
//        if ($data) {
//            $data['student'] = Db::table('tb_record_course_student')->where('cid', $data['id'])->select();
//        }
//        $data = [
//            'course' => $data,
//            'user' => $user
//        ];

        //获取正在上课的信息 判断当前时间是否有课
        $data = Db::table('tb_course')->where('start_time', '<', date('H:i:s', time()))
            ->where('end_time', '>', date('H:i:s', time()))->where('week', date('w', time()))
            ->find();
        $student0 = [];
        $student = [];
        if ($data) {
            $student0 = Db::table('tb_course_student')->join('tb_user_student', 'tb_course_student.sid=tb_user_student.id')->where('tb_course_student.cid', $data['id'])->field("tb_user_student.id as value,username as title")->select()->toArray();
        }

        $data = [
            'course' => $data,
            'user' => $user,
            'student0' => $student0
        ];


//        $data['user']['username'] = mb_substr($data['user']['username'], 0, 1, 'utf-8');
        return returnJson(0, 'success', $data);

    }

    //开始上课
    public function startClass()
    {
        $user = checkLogin();
        if ($user['type'] != 1) {
            exit(returnJson(1, '无权限'));
        }
        $data = Db::table('tb_record_course')->where('uid', $user['uid'])->where('end_time', null)->find();
        if ($data) {
            //更新上课状态
            $data0 = input('post.');
            $data0 = [
                'uid' => $user['uid'],
                'title' => $data0['title'],
                'sid' => $data0['sid'],
            ];
            try {
                Db::table("tb_record_course")->where("id", $data['id'])->update($data0);
                return returnJson(0, '更新上课状态成功');
            } catch (Exception $e) {
                return returnJson(1, '更新上课状态失败', $e->getMessage());
            }


        }
        try {
            $data = input('post.');
            $data = [
                'uid' => $user['uid'],
                'title' => $data['title'],
                'sid' => $data['sid'],
                'start_time' => date('Y-m-d H:i:s', time())
            ];
            Db::table("tb_record_course")->insert($data);
        } catch (Exception $e) {
            return returnJson(1, '开始上课失败', $e->getMessage());
        }
        return returnJson(0, '开始上课成功');
    }

    //结束上课
    public function endClass()
    {
        $user = checkLogin();
        if ($user['type'] != 2) {
            return (returnJson(0, '无权限'));
        }
        $result = Db::table('tb_record_course')->where('uid', $user['uid'])->where('end_time', null)->find();
        if (!$result) {
            return returnJson(1, '未开始上课');
        }
        $data = input('post.');
        $data = [
            'uid' => $user['uid'],
            'remark' => $data['remark'],
            'star' => $data['star'],
            'end_time' => date('Y-m-d H:i:s', time()),
        ];
        try {
            Db::table("tb_record_course")->where('uid', $user['uid'])->where('end_time', null)->update($data);
        } catch (Exception $e) {
            return returnJson(1, '结束上课失败');
        }
        //计算学生积分
        try {
            $students = Db::table('tb_record_course_student')->where('cid', $result['id'])->select()->toArray();
            foreach ($students as $student) {
                $score = $student['score'] + 10;
                $data = [
                    'sid' => $student['sid'],
                    'score' => $score,
                    'reason' => '上课积分',
                    'update_time' => date('Y-m-d H:i:s', time())
                ];
                Db::table('tb_record_score')->insert($data);
                Db::table('tb_user_student')->where('id', $student['sid'])->setInc('score', $score);

            }
        } catch (Exception $e) {
            return returnJson(1, '计算学生积分失败', $e->getMessage());
        }

        return returnJson(0, '结束上课成功');
    }

    //获取上课状态
    public function getClassState()
    {
//        $user = checkLogin();
//        if ($user['type'] != 1) {
//            exit(returnJson(1, '无权限'));
//        }
//        $data = Db::table('tb_record_course')->where('uid', $user['uid'])->where('end_time', null)->find();
//        if (!$data) {
//            return returnJson(1, '未开始上课');
//        }
//        return returnJson(0, '上课中', $data);
        //读取课程表 判断当前时间是否在上课时间内
        $data = Db::table('tb_course')->where('start_time', '<', date('H:i:s', time()))
            ->where('end_time', '>', date('H:i:s', time()))->where('week', date('w', time()))
            ->find();
        if ($data) {
            return returnJson(0, '上课中', $data);
        } else {
            return returnJson(1, '未上课', $data);
        }

    }

    public function getStudentList()
    {
        $user = checkLogin();
//        if ($user['type'] != 1) {
//            exit(returnJson(1, '无权限'));
//        }
        $data = Db::table('tb_record_course')->where('uid', $user['uid'])->where('end_time', null)->find();
        if (!$data) {
            return returnJson(1, '未开始上课');
        }
        $data = Db::table('tb_record_course_student')->where('cid', $data['id'])
            ->alias('a')
            ->join('tb_user_student b', 'a.sid=b.id')
            ->field('a.*,b.username')
            ->select();
        return returnJson(0, 'success', $data, count($data));
    }

    //获取课程列表
    public function getSubjectList()
    {
        $user = checkLogin();
        if ($user['type'] != 2) {
            return (returnJson(0, '无权限'));
        }
        $data = Db::table('tb_record_subject')->where("state", 1)->select();
        return returnJson(0, 'success', $data, count($data));
    }

    //记录学生评分
    public function submitScore()
    {
        $user = checkLogin();
        if ($user['type'] != 1) {
            exit(returnJson(1, '无权限'));
        }
        $data = input('post.');
        //判断cid是否属于这个教师
//        $result = Db::table('tb_record_course')->where(['uid'=> $user['uid'],'cid'=>$data['id']])->find();
//        if (!$result) {
//            return returnJson(1, '未找到课程');
//        }
//        if ($data['type'] == 'points1') {
//            $data0 = [
//                'points1' => $data['value'],
//            ];
//        }
//        if ($data['type'] == 'points2') {
//            $data0 = [
//                'points2' => $data['value'],
//            ];
//        }
//        if ($data['type'] == 'points3') {
//            $data0 = [
//                'points3' => $data['value'],
//            ];
//        }
        try {
            Db::table("tb_record_courseRE_student")->where(["id" => $data['id']])->update(['score' => $data['score']]);
        } catch (Exception $e) {
            return returnJson(1, '评分失败', $e->getMessage());
        }
        return returnJson(0, '评分成功');
    }


}