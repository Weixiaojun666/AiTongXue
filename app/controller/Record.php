<?php

namespace app\controller;

use think\db\exception\DataNotFoundException;
use think\db\exception\DbException;
use think\db\exception\ModelNotFoundException;
use think\facade\Db;
use think\response\Json;

class Record
{
    public function getPointsList($page = 1, $limit = 10, $username = null,$id=null)
    {
        $user = checkLogin();
        $data = Db::table('tb_record_points')
            ->leftjoin('tb_user_student', 'tb_record_points.sid=tb_user_student.id')
            ->field('tb_record_points.*,tb_user_student.username as username');
        return $this->extracted($username, $data, $id, $page, $limit);
    }

    public function getMatchList($page = 1, $limit = 10, $username = null,$id=null)
    {
        $user = checkLogin();
        $data = Db::table('tb_record_match')
            ->leftjoin('tb_user_student', 'tb_record_match.sid=tb_user_student.id')
            ->field('tb_record_match.*,tb_user_student.username as username');
        return $this->extracted($username, $data, $id, $page, $limit);
    }
    public function getRenewalList($page = 1, $limit = 10, $username = null,$id=null)
    {
        $user = checkLogin();
        $data = Db::table('tb_record_renewal')
            ->leftjoin('tb_user_student', 'tb_record_renewal.sid=tb_user_student.id')
            ->field('tb_record_renewal.*,tb_user_student.username as username');
        return $this->extracted($username, $data, $id, $page, $limit);
    }

    public function getCourseList($page = 1, $limit = 10, $username = null)
    {
        $user = checkLogin();
        $data = Db::table('tb_record_course')
//            ->leftjoin('tb_user_student','tb_record_course.sid=tb_user_student.id')
            ->leftjoin('tb_user', 'tb_record_course.tid=tb_user.id')
            ->leftjoin('tb_subject', 'tb_record_course.sid=tb_subject.id')
            ->field('tb_record_course.*,tb_user.username as username,tb_subject.name as subject');
//        if ($sname) {
//            $data = $data->where('tb_user_student.username', 'like', '%' . $sname . '%');
//        }
        if ($username) {
            $data = $data->where('tb_user.username', 'like', '%' . $username . '%');
        }
        $count = $data->count();
        $data = $data->page($page, $limit)->select();

        return (returnJson(0, 'success', $data, $count));


    }

    /**
     * @param mixed $username
     * @param Db $data
     * @param mixed $id
     * @param mixed $page
     * @param mixed $limit
     * @return Json
     * @throws DataNotFoundException
     * @throws DbException
     * @throws ModelNotFoundException
     */
    public function extracted( $username,  $data,  $id,  $page,  $limit): Json
    {
        if ($username) {
            $data = $data->where('tb_user_student.username', 'like', '%' . $username . '%');
        }
        if ($id) {
            $data = $data->where('tb_user_student.id', $id);
        }
        $count = $data->count();
        $data = $data->page($page, $limit)->select();

        return (returnJson(0, 'success', $data, $count));
    }



    //下面是save（新增和修改）

    public function savePoints()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $data = input('post.');
        //如果存在id 则去掉username和sid
        if (isset($data['id'])||$data['id']!=null||$data['id']!='') {
            unset($data['username']);

        }
        //如果存在sid 则去掉id和username
        if (isset($data['sid'])||$data['sid']!=null||$data['sid']!='') {
            unset($data['username']);
        }

        //如果ID=0则新增
        if ($data['id'] == 0||$data['id']==null||$data['id']=='') {
            unset($data['id']);
        }
        try {
            Db::table('tb_record_points')->save($data);
            $sid = $data['sid'];
            $points = Db::table('tb_record_points')->where('sid', $sid)->sum('score');
            Db::table('tb_user_student')->where('id', $sid)->update(['score' => $points]);
        } catch (\Exception $e) {
            return (returnJson(1, $e->getMessage()));
        }
        return (returnJson(0, 'success'));
    }

    //下面为删除

    public function deletePoints()
    {
        $user = checkLogin();
        if ($user['type'] != 3) {
            return (returnJson(1, '无权限'));
        }
        $id = input('post.id');
        $sid = input('post.sid');
        try {
            Db::table('tb_record_points')->where('id', $id)->delete();
            $points = Db::table('tb_record_points')->where('sid', $sid)->sum('score');
            Db::table('tb_user_student')->where('id', $sid)->update(['score' => $points]);
        } catch (\Exception $e) {
            return (returnJson(1, $e->getMessage()));
        }
        return (returnJson(0, 'success'));
    }

}